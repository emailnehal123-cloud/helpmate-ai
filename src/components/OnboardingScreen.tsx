import { CheckCircle2, Sparkles } from 'lucide-react';
import { APP_LANGUAGES } from '../i18n/languages';
import { LOCALIZED_STRINGS } from '../i18n/strings';
import { LanguageCode } from '../types';

interface OnboardingScreenProps {
  selectedLanguage: LanguageCode;
  onSelectLanguage: (code: LanguageCode) => void;
  onCompleteOnboarding: (code: LanguageCode) => void;
}

export function OnboardingScreen({
  selectedLanguage,
  onSelectLanguage,
  onCompleteOnboarding,
}: OnboardingScreenProps) {
  const strings = LOCALIZED_STRINGS[selectedLanguage];

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="mascot-hero-ring">
          <img
            src="/helpmate-mascot.jpg"
            alt="HelpMate AI cute purple mascot"
            className="mascot-hero-img"
          />
        </div>

        <h1 className="onboarding-title">{strings.onboardingTitle}</h1>
        <p className="onboarding-subtitle">{strings.onboardingSubtitle}</p>

        <div className="onboarding-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Sparkles size={20} color="#FBBF24" />
            <h2 style={{ margin: 0, fontSize: 19 }}>{strings.chooseLanguageTitle}</h2>
          </div>

          <div className="lang-grid">
            {APP_LANGUAGES.map((lang) => {
              const isSelected = lang.code === selectedLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onSelectLanguage(lang.code)}
                  className={`lang-chip ${isSelected ? 'selected' : ''}`}
                >
                  <span style={{ fontSize: 20 }}>{lang.flagEmoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{lang.nativeName}</div>
                    <div
                      style={{
                        fontSize: 11,
                        opacity: isSelected ? 0.85 : 0.7,
                      }}
                    >
                      {lang.englishName}
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 size={18} color="#FBBF24" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="cta-pill"
            onClick={() => onCompleteOnboarding(selectedLanguage)}
          >
            {strings.startChattingCta}
          </button>
        </div>
      </div>
    </div>
  );
}
