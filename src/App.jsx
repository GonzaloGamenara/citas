import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import BackgroundSparkles from './components/BackgroundSparkles';
import ProposalStep from './components/ProposalStep';
import DateTypeStep from './components/DateTypeStep';
import CalendarStep from './components/CalendarStep';
import ConfirmationStep from './components/ConfirmationStep';
import './styles/theme.css';

function App() {
  const [step, setStep] = useState(1);

  const [selectedOption, setSelectedOption] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  return (
    <main className="app-container">
      <BackgroundSparkles />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <ProposalStep key="step1" onAccept={() => setStep(2)} />
        )}

        {step === 2 && (
          <DateTypeStep
            key="step2"
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            customNote={customNote}
            setCustomNote={setCustomNote}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <CalendarStep
            key="step3"
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <ConfirmationStep
            key="step4"
            selectedOption={selectedOption}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            customNote={customNote}
            onBack={() => setStep(3)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;
