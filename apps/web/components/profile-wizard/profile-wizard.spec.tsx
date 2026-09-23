import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileWizard } from "./profile-wizard";

const fetchMock = vi.fn<typeof fetch>();

const taxonomy = [
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Annotation",
    specialization: "Bounding Box",
    slug: "eqourse-ai-data-services-annotation-bounding-box",
  },
];

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function profile(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user-1",
    state: "DRAFT",
    completionPercentage: 0,
    ...overrides,
  };
}

function installFetch(initialProfile = profile()) {
  fetchMock.mockImplementation((input, init) => {
    const path = String(input);
    if (path.endsWith("/api/v1/skill-taxonomy")) {
      return Promise.resolve(response(taxonomy));
    }
    if (path === "/api/v1/profiles/me" && init?.method === "PATCH") {
      return Promise.resolve(response({
        ...initialProfile,
        ...JSON.parse(String(init.body)),
        completionPercentage: 35,
      }));
    }
    return Promise.resolve(response(initialProfile));
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  installFetch();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function renderReady(): Promise<void> {
  render(<ProfileWizard />);
  await screen.findByRole("heading", { name: "Personal" });
}

function patches(): Array<Record<string, unknown>> {
  return fetchMock.mock.calls.flatMap(([, init]) =>
    init?.method === "PATCH" ? [JSON.parse(String(init.body)) as Record<string, unknown>] : [],
  );
}

describe("FR-REG-02B profile wizard", () => {
  it("does not write when an incomplete wizard is opened and abandoned", async () => {
    const view = render(<ProfileWizard />);
    await screen.findByRole("heading", { name: "Personal" });

    view.unmount();

    expect(patches()).toEqual([]);
  });

  it("saves a wholly empty draft as an empty PATCH body", async () => {
    await renderReady();

    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => expect(patches()).toContainEqual({}));
  });

  it("opens a saved draft without resumeSection on its first incomplete section", async () => {
    installFetch(profile({ personal: { firstName: "Ada", lastName: "Lovelace" } }));
    render(<ProfileWizard />);

    expect(await screen.findByRole("heading", { name: "Education" })).toBeVisible();
  });

  it("resumes at the last recorded in-scope section", async () => {
    installFetch(profile({ resumeSection: "LANGUAGES" }));
    render(<ProfileWizard />);

    expect(await screen.findByRole("heading", { name: "Languages" })).toBeVisible();
  });

  it("renders completion only from API responses and refreshes it after PATCH", async () => {
    installFetch(profile({ completionPercentage: 10 }));
    render(<ProfileWizard />);
    expect(await screen.findByText("10% complete")).toBeVisible();

    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Ada" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByText("35% complete")).toBeVisible();
  });

  it("persists every in-scope section independently and records navigation", async () => {
    await renderReady();

    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Ada" } });
    fireEvent.click(screen.getByRole("button", { name: "Education" }));
    await screen.findByRole("heading", { name: "Education" });
    fireEvent.change(screen.getByLabelText("Institution 1"), { target: { value: "Example University" } });
    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    await screen.findByRole("heading", { name: "Skills" });
    fireEvent.change(screen.getByLabelText("Skill 1"), { target: { value: taxonomy[0]!.slug } });
    fireEvent.click(screen.getByRole("button", { name: "Languages" }));
    await screen.findByRole("heading", { name: "Languages" });
    fireEvent.change(screen.getByLabelText("Language tag 1"), { target: { value: "en-GB" } });
    fireEvent.click(screen.getByRole("button", { name: "Experience" }));
    await screen.findByRole("heading", { name: "Experience" });
    fireEvent.change(screen.getByLabelText("Total experience in months"), { target: { value: "24" } });
    fireEvent.click(screen.getByRole("button", { name: "Samples" }));
    await screen.findByRole("heading", { name: "Samples" });
    fireEvent.change(screen.getByLabelText("Sample title 1"), { target: { value: "Portfolio" } });
    fireEvent.change(screen.getByLabelText("Storage object key 1"), { target: { value: "profiles/user-1/portfolio.pdf" } });
    fireEvent.click(screen.getByRole("button", { name: "Availability" }));
    await screen.findByRole("heading", { name: "Availability" });
    fireEvent.change(screen.getByLabelText("Weekly hours"), { target: { value: "40" } });
    fireEvent.click(screen.getByRole("button", { name: "Rate" }));
    await screen.findByRole("heading", { name: "Rate" });
    fireEvent.change(screen.getByLabelText("Amount in minor units"), { target: { value: "1250" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(patches()).toEqual(expect.arrayContaining([
        expect.objectContaining({ personal: { firstName: "Ada" }, resumeSection: "EDUCATION" }),
        expect.objectContaining({ education: [{ institution: "Example University" }], resumeSection: "SKILLS" }),
        expect.objectContaining({ skills: [{ taxonomySlug: taxonomy[0]!.slug }], resumeSection: "LANGUAGES" }),
        expect.objectContaining({ languages: [{ languageCode: "en-GB" }], resumeSection: "EXPERIENCE" }),
        expect.objectContaining({ experience: { totalMonths: 24 }, resumeSection: "SAMPLES" }),
        expect.objectContaining({ samples: [{ title: "Portfolio", objectKey: "profiles/user-1/portfolio.pdf" }], resumeSection: "AVAILABILITY" }),
        expect.objectContaining({ availability: { weeklyHours: 40 }, resumeSection: "RATE" }),
        expect.objectContaining({ rate: { amountMinor: 1250 } }),
      ]));
    });
  });

  it("waits for the serialized save before changing sections", async () => {
    let finishSave: ((value: Response) => void) | undefined;
    fetchMock.mockImplementation((input, init) => {
      if (String(input).endsWith("/api/v1/skill-taxonomy")) return Promise.resolve(response(taxonomy));
      if (init?.method === "PATCH") {
        return new Promise<Response>((resolve) => { finishSave = resolve; });
      }
      return Promise.resolve(response(profile()));
    });
    await renderReady();
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Ada" } });
    fireEvent.click(screen.getByRole("button", { name: "Education" }));

    expect(screen.getByRole("heading", { name: "Personal" })).toBeVisible();
    await waitFor(() => expect(finishSave).toBeDefined());
    finishSave?.(response(profile({ completionPercentage: 5 })));

    expect(await screen.findByRole("heading", { name: "Education" })).toBeVisible();
  });

  it("offers only active endpoint skills and never sends labels or null values", async () => {
    installFetch(profile({
      skills: [{ taxonomySlug: "retired-skill", level: "EXPERT" }],
      personal: { firstName: "Ada" },
      resumeSection: "SKILLS",
    }));
    render(<ProfileWizard />);

    const select = await screen.findByLabelText<HTMLSelectElement>("Skill 1");
    expect(Array.from(select.options).map((option) => option.value)).toEqual([
      "",
      taxonomy[0]!.slug,
      "retired-skill",
    ]);
    expect(select.options[2]).toBeDisabled();
    fireEvent.change(select, { target: { value: taxonomy[0]!.slug } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      const body = JSON.stringify(patches().at(-1));
      expect(body).toContain(taxonomy[0]!.slug);
      expect(body).not.toContain("Bounding Box");
      expect(body).not.toContain(":null");
    });
  });

  it("validates and explains BCP 47 language tags before saving", async () => {
    installFetch(profile({ resumeSection: "LANGUAGES" }));
    render(<ProfileWizard />);
    const input = await screen.findByLabelText("Language tag 1");
    expect(screen.getByText(/BCP 47/i)).toBeVisible();
    fireEvent.change(input, { target: { value: "EN_gb" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/valid BCP 47 language tag/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(patches()).toEqual([]);
  });

  it("surfaces API validation errors instead of swallowing them", async () => {
    fetchMock.mockImplementation((input, init) => {
      if (String(input).endsWith("/api/v1/skill-taxonomy")) return Promise.resolve(response(taxonomy));
      if (init?.method === "PATCH") {
        return Promise.resolve(response({ message: "Weekly hours must be between 1 and 168" }, 400));
      }
      return Promise.resolve(response(profile({ resumeSection: "AVAILABILITY" })));
    });
    render(<ProfileWizard />);
    await screen.findByRole("heading", { name: "Availability" });
    fireEvent.change(screen.getByLabelText("Weekly hours"), { target: { value: "40" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Weekly hours must be between 1 and 168",
    );
  });
});
