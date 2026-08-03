const COUNTRY_SELECT_ID = "registration-country";
const COUNTRY_NOTE_ID = "registration-country-note";

export function CountrySelectStub() {
  return (
    <div className="registration-country-field">
      <h2 className="home-section-title">Your country</h2>
      <label htmlFor={COUNTRY_SELECT_ID}>Country</label>
      <select
        id={COUNTRY_SELECT_ID}
        aria-describedby={COUNTRY_NOTE_ID}
        disabled
        defaultValue=""
      >
        <option value="">Country selection is not available yet</option>
      </select>
      <p id={COUNTRY_NOTE_ID} className="registration-country-note">
        Country selection opens with registration.
      </p>
    </div>
  );
}
