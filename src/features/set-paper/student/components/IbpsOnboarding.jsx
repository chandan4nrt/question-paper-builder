import { useState } from 'react';
import { User, Lock, Keyboard, ChevronRight, ChevronLeft, Check } from 'lucide-react';

export function IbpsOnboarding({
  examTitle = 'New IBPS Test',
  subjectName = 'General Section',
  numQuestions = 20,
  totalMarks = 50,
  durationMins = 60,
  studentName = '',
  setStudentName,
  rollNo = '',
  setRollNo,
  onReadyToBegin,
}) {
  const [step, setStep] = useState(1); // 1: Login, 2: General Instructions, 3: Other Instructions
  const [password, setPassword] = useState('11111');
  const [language, setLanguage] = useState('English');
  const [defaultLanguage, setDefaultLanguage] = useState('English');
  const [declared, setDeclared] = useState(false);

  const displayCandidateName = studentName.trim() || 'John Smith';
  const displayRollNo = rollNo.trim() || '11111';

  function handleLogin(e) {
    if (e) e.preventDefault();
    const finalName = studentName.trim() || 'John Smith';
    setStudentName(finalName);
    try {
      localStorage.setItem('be_student_name', finalName);
    } catch {}
    setStep(2);
  }

  function handleReadyToBegin() {
    if (!declared) return;
    if (onReadyToBegin) onReadyToBegin();
  }

  // --- STEP 1: LOGIN SCREEN ---
  if (step === 1) {
    return (
      <div className="ibps-onboarding-container">
        {/* Top Header */}
        <header className="ibps-onboarding-top-bar">
          <div className="ibps-onboarding-logo-group">
            <div className="ibps-onboarding-logo-badge">PAPER BUILDER</div>
          </div>
          <div className="ibps-onboarding-exam-name">{examTitle}</div>
        </header>

        {/* Dark Gray Candidate Banner */}
        <div className="ibps-login-banner">
          <div className="ibps-banner-left">
            <div className="ibps-sys-label">System Name :</div>
            <div className="ibps-sys-name">C001</div>
            <div className="ibps-sys-note">
              Kindly contact the invigilator if there are any discrepancies in the Name and Photograph displayed on the screen or if the photograph is not yours
            </div>
          </div>
          <div className="ibps-banner-right">
            <div className="ibps-candidate-label">Candidate Name :</div>
            <div className="ibps-candidate-title">{displayCandidateName}</div>
            <div className="ibps-mock-tag">Mock Exam</div>
          </div>
          <div className="ibps-avatar-box">
            <div className="ibps-avatar-placeholder">
              <User size={42} color="#555" />
            </div>
          </div>
        </div>

        {/* Login Form Center Box */}
        <main className="ibps-login-body">
          <div className="ibps-login-card">
            <div className="ibps-login-card-head">Login</div>
            <form onSubmit={handleLogin} className="ibps-login-form">
              <div className="ibps-login-field">
                <div className="ibps-input-icon">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter Candidate Name / Username"
                  className="ibps-login-input"
                />
                <div className="ibps-keyboard-icon" title="Virtual Keyboard">
                  <Keyboard size={16} />
                </div>
              </div>

              <div className="ibps-login-field">
                <div className="ibps-input-icon">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="ibps-login-input"
                />
                <div className="ibps-keyboard-icon" title="Virtual Keyboard">
                  <Keyboard size={16} />
                </div>
              </div>

              <div className="ibps-login-field" style={{ marginTop: '0.4rem' }}>
                <div className="ibps-input-icon" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                  #
                </div>
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo && setRollNo(e.target.value)}
                  placeholder="Roll No (Optional)"
                  className="ibps-login-input"
                />
              </div>

              <button type="submit" className="ibps-btn-signin">
                Sign In
              </button>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="ibps-onboarding-footer">Version 17.05.21</footer>
      </div>
    );
  }

  // --- STEP 2: GENERAL INSTRUCTIONS ---
  if (step === 2) {
    return (
      <div className="ibps-onboarding-container">
        {/* Top Header */}
        <header className="ibps-onboarding-top-bar">
          <div className="ibps-onboarding-logo-group">
            <div className="ibps-onboarding-logo-badge">PAPER BUILDER</div>
          </div>
          <div className="ibps-onboarding-exam-name">{examTitle}</div>
        </header>

        {/* Instructions Subheader Tab */}
        <div className="ibps-instructions-subhead">
          <span>Instructions</span>
        </div>

        {/* Instructions Main Layout */}
        <div className="ibps-instructions-grid">
          {/* Left instructions panel */}
          <div className="ibps-instructions-left">
            <div className="ibps-lang-picker-row">
              <span>View in :</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            <div className="ibps-scroll-instructions">
              <h3 className="ibps-inst-title">General Instructions:</h3>
              <ol className="ibps-inst-list">
                <li>
                  Total duration of examination is {durationMins} minutes. (20 minutes extra for every 60 minutes (1 hour) of the examination time for candidates with disability eligible for compensatory time).
                </li>
                <li>
                  The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.
                </li>
                <li>
                  The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                  <div className="ibps-palette-symbols-table">
                    <div className="ibps-sym-row">
                      <span className="ibps-sym-badge ibps-sym-not-visited">1</span>
                      <span>You have not visited the question yet.</span>
                    </div>
                    <div className="ibps-sym-row">
                      <span className="ibps-sym-badge ibps-sym-not-answered">2</span>
                      <span>You have not answered the question.</span>
                    </div>
                    <div className="ibps-sym-row">
                      <span className="ibps-sym-badge ibps-sym-answered">3</span>
                      <span>You have answered the question.</span>
                    </div>
                    <div className="ibps-sym-row">
                      <span className="ibps-sym-badge ibps-sym-marked">4</span>
                      <span>You have NOT answered the question, but have marked the question for review.</span>
                    </div>
                    <div className="ibps-sym-row">
                      <span className="ibps-sym-badge ibps-sym-ans-marked">
                        5 <Check size={10} className="ibps-sym-check" />
                      </span>
                      <span>The question(s) "Answered and Marked for Review" will be considered for evaluation.</span>
                    </div>
                  </div>
                </li>
                <li>
                  The Marked for Review status for a question simply indicates that you would like to look at that question again. If a question is answered and Marked for Review, your answer for that question will be considered in the evaluation.
                </li>
                <li>
                  You can click on the "&gt;" arrow which appears to the left of question palette to collapse the question palette thereby maximizing the question window. To view the question palette again, you can click on "&lt;" which appears on the right side of question window.
                </li>
                <li>
                  You can click on your "Profile" image on top right corner of your screen to change the language during the exam for entire question paper. On clicking of Profile image you will get a drop-down to change the question content to the desired language.
                </li>
                <li>
                  You can click on Scroll Down to navigate to the bottom and Scroll Up to navigate to the top of the question area, without scrolling.
                </li>
              </ol>

              <h4 className="ibps-inst-subtitle">Navigating to a Question:</h4>
              <ul className="ibps-inst-bullets">
                <li>To answer a question, do the following:</li>
                <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
                <li>Click on <strong>Save &amp; Next</strong> to save your answer for the current question and then go to the next question.</li>
                <li>Click on <strong>Mark for Review &amp; Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
              </ul>

              <h4 className="ibps-inst-subtitle">Answering a Question :</h4>
              <ul className="ibps-inst-bullets">
                <li>Procedure for answering a multiple choice type question:</li>
                <li>To select your answer, click on the button of one of the options</li>
                <li>To deselect your chosen answer, click on the button of the chosen option again or click on the Clear Response button</li>
                <li>To change your chosen answer, click on the button of another option</li>
                <li>To save your answer, you MUST click on the <strong>Save &amp; Next</strong> button</li>
                <li>To mark the question for review, click on the <strong>Mark for Review &amp; Next</strong> button. If an answer is selected for a question that is Marked for Review, that answer will be considered in the evaluation.</li>
                <li>To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.</li>
                <li>Note that ONLY Questions for which answers are saved or marked for review after answering will be considered for evaluation.</li>
              </ul>

              <h4 className="ibps-inst-subtitle">Navigating through sections:</h4>
              <ul className="ibps-inst-bullets">
                <li>Sections in this question paper are displayed on the top bar of the screen. Questions in a section can be viewed by clicking on the section name. The section you are currently viewing is highlighted.</li>
                <li>After clicking the Save &amp; Next button on the last question for a section, you will automatically be taken to the first question of the next section.</li>
                <li>You can shuffle between tests and questions anytime during the examination as per your convenience only during the time stipulated.</li>
                <li>Candidate can view the corresponding section summary as part of the legend that appears in every section above the question palette.</li>
              </ul>
            </div>

            <div className="ibps-inst-bottom-actions">
              <span style={{ flex: 1 }} />
              <button type="button" className="ibps-btn-next" onClick={() => setStep(3)}>
                Next &gt;
              </button>
            </div>
          </div>

          {/* Right Profile Panel */}
          <div className="ibps-instructions-right">
            <div className="ibps-profile-card">
              <div className="ibps-profile-photo">
                <User size={54} color="#666" />
              </div>
              <div className="ibps-profile-name">{displayCandidateName}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STEP 3: OTHER IMPORTANT INSTRUCTIONS ---
  return (
    <div className="ibps-onboarding-container">
      {/* Top Header */}
      <header className="ibps-onboarding-top-bar">
        <div className="ibps-onboarding-logo-group">
          <div className="ibps-onboarding-logo-badge">PAPER BUILDER</div>
        </div>
        <div className="ibps-onboarding-exam-name">{examTitle}</div>
      </header>

      {/* Header Tab */}
      <div className="ibps-instructions-subhead">
        <span>Other Important Instructions</span>
      </div>

      {/* Grid */}
      <div className="ibps-instructions-grid">
        <div className="ibps-instructions-left">
          <div className="ibps-lang-picker-row">
            <span>View in :</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          <div className="ibps-scroll-instructions">
            <div className="ibps-exam-logo-header">
              <div className="ibps-big-logo">PAPER BUILDER</div>
              <div className="ibps-exam-title-underline">Instructions for Online Examination</div>
            </div>

            <ol className="ibps-inst-list" style={{ marginTop: '1rem' }}>
              <li>
                The text displayed on the screen must be written by you in the space provided in the call letter. You will be given <strong>5 minutes</strong> for this activity.
              </li>
              <li>The Question Paper consists of objective type questions as follows:</li>
            </ol>

            <table className="ibps-inst-table">
              <thead>
                <tr>
                  <th>Sr.No.</th>
                  <th>Name of the Test</th>
                  <th>No. of Questions</th>
                  <th>Max. Marks</th>
                  <th>Version</th>
                  <th>Duration</th>
                  <th>Duration for PwBD candidates eligible for compensatory time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>{subjectName || examTitle}</td>
                  <td>{numQuestions}</td>
                  <td>{totalMarks}</td>
                  <td>1.0</td>
                  <td>{durationMins} mins</td>
                  <td>20 mins extra</td>
                </tr>
              </tbody>
            </table>

            <div className="ibps-declaration-section">
              <div className="ibps-default-lang-row">
                <span>Choose your default language :</span>
                <select value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value)}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              <div className="ibps-warning-text">
                Please note all questions will appear in your default language. This language can be changed for a particular question later on.
              </div>

              <label className="ibps-checkbox-label">
                <input
                  type="checkbox"
                  checked={declared}
                  onChange={(e) => setDeclared(e.target.checked)}
                />
                <span>
                  I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations
                </span>
              </label>
            </div>
          </div>

          <div className="ibps-inst-bottom-actions">
            <button type="button" className="ibps-btn-prev-page" onClick={() => setStep(2)}>
              &lt; Previous
            </button>
            <span style={{ flex: 1 }} />
            <button
              type="button"
              className={`ibps-btn-ready ${declared ? 'active' : 'disabled'}`}
              disabled={!declared}
              onClick={handleReadyToBegin}
            >
              I am ready to begin
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="ibps-instructions-right">
          <div className="ibps-profile-card">
            <div className="ibps-profile-photo">
              <User size={54} color="#666" />
            </div>
            <div className="ibps-profile-name">{displayCandidateName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
