import { useState } from "react";
import Step1Profile from "./components/Step1Profile.jsx";
import Step2PhotoUpload from "./components/Step2PhotoUpload.jsx";
import Step3Loading from "./components/Step3Loading.jsx";
import ResultScreen from "./components/ResultScreen.jsx";

export default function App() {
  // 今どのSTEPを表示するか（1〜4）をここで一元管理します
  const [step, setStep] = useState(1);

  // 各画面の入力内容・結果もここに集約します
  const [profile, setProfile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleProfileNext = (profileData) => {
    setProfile(profileData);
    setStep(2);
  };

  const handlePhotoNext = (file) => {
    setPhotoFile(file);
    setStep(3);
  };

  const handleAnalysisComplete = (resultData) => {
    setResult(resultData);
    setStep(4);
  };

  const handleRestart = () => {
    setProfile(null);
    setPhotoFile(null);
    setResult(null);
    setStep(1);
  };

  if (step === 1) return <Step1Profile onNext={handleProfileNext} />;
  if (step === 2) return <Step2PhotoUpload onNext={handlePhotoNext} />;
  if (step === 3) return <Step3Loading profile={profile} photoFile={photoFile} onComplete={handleAnalysisComplete} />;
  return <ResultScreen result={result} onRestart={handleRestart} />;
}
