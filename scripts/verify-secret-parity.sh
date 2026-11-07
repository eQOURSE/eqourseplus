#!/usr/bin/env bash
# Read-only: compares GCP Secret Manager with AWS SSM; writes nothing to either cloud.
# Never modify this script to print secret values.

set -euo pipefail
if [[ $- == *x* ]]; then
  set +x
  printf 'Refusing to run with shell tracing enabled.\n' >&2
  exit 2
fi
set +x

# SSM /eqplus/<env>/<NAME> -> GCP production / staging secret name.
# The last six names are shared GCP secrets for both environments.
names=(
  MONGODB_URI MONGODB_URI_MIGRATOR JWT_SECRET
  VENDOR_IDENTIFIER_HMAC_SECRET CLIENT_IDENTIFIER_HMAC_SECRET
  RESEND_API_KEY R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY SENTRY_DSN
)
gcp_production=(
  MONGODB_URI MONGODB_URI_MIGRATOR JWT_SECRET
  VENDOR_IDENTIFIER_HMAC_SECRET CLIENT_IDENTIFIER_HMAC_SECRET
  RESEND_API_KEY R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY SENTRY_DSN
)
gcp_staging=(
  MONGODB_URI_STAGING MONGODB_URI_MIGRATOR_STAGING JWT_SECRET_STAGING
  VENDOR_IDENTIFIER_HMAC_SECRET CLIENT_IDENTIFIER_HMAC_SECRET
  RESEND_API_KEY R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY SENTRY_DSN
)

for command in gcloud aws sha256sum perl; do
  if ! command -v "$command" >/dev/null 2>&1; then
    printf 'Preflight failed: %s is required.\n' "$command" >&2
    exit 2
  fi
done

if ! project=$(gcloud config get-value project 2>/dev/null) || [[ $project != eqplus-503212 ]]; then
  printf 'Preflight failed: active GCP project must be eqplus-503212.\n' >&2
  exit 2
fi
if ! account=$(aws sts get-caller-identity --query Account --output text 2>/dev/null) || [[ $account != 284874841026 ]]; then
  printf 'Preflight failed: active AWS account must be 284874841026.\n' >&2
  exit 2
fi
if ! region=$(aws configure get region 2>/dev/null) || [[ $region != ap-south-1 ]]; then
  printf 'Preflight failed: active AWS region must be ap-south-1.\n' >&2
  exit 2
fi

ok=0
mismatch=0
error=0

for env in production staging; do
  for i in "${!names[@]}"; do
    name=${names[i]}
    if [[ $env == production ]]; then
      gcp_name=${gcp_production[i]}
    else
      gcp_name=${gcp_staging[i]}
    fi

    if ! gcp_version=$(gcloud secrets versions list "$gcp_name" --project=eqplus-503212 --filter='state=ENABLED' --sort-by='~createTime' --limit=1 --format='value(name)' 2>/dev/null) || [[ -z $gcp_version ]]; then
      printf '%s/%s: ERROR GCP_VERSION\n' "$env" "$name"
      error=$((error + 1))
      continue
    fi
    gcp_version=${gcp_version##*/}

    # Normalize one stored trailing LF on both sides before hashing. AWS's
    # --output text adds one further LF, so remove that formatter LF first.
    # Only the sha256sum result enters a shell variable; values stay in pipes.
    if ! gcp_digest=$(gcloud secrets versions access "$gcp_version" --secret="$gcp_name" --project=eqplus-503212 2>/dev/null | perl -0777 -pe 's/\n\z//' | sha256sum); then
      printf '%s/%s: ERROR GCP_READ\n' "$env" "$name"
      error=$((error + 1))
      continue
    fi
    if ! aws_digest=$(aws ssm get-parameter --name="/eqplus/$env/$name" --with-decryption --query Parameter.Value --output text --region ap-south-1 2>/dev/null | perl -0777 -pe 's/\n\z//' | perl -0777 -pe 's/\n\z//' | sha256sum); then
      printf '%s/%s: ERROR AWS_READ\n' "$env" "$name"
      error=$((error + 1))
      continue
    fi

    if [[ ${gcp_digest%% *} == "${aws_digest%% *}" ]]; then
      printf '%s/%s: OK\n' "$env" "$name"
      ok=$((ok + 1))
    else
      printf '%s/%s: MISMATCH\n' "$env" "$name"
      mismatch=$((mismatch + 1))
    fi
  done
done

printf 'Summary: %d OK, %d MISMATCH, %d ERROR\n' "$ok" "$mismatch" "$error"
if (( mismatch > 0 || error > 0 )); then
  exit 1
fi
