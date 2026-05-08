interface FirstRunNoticeProps {
  onDismiss: () => void;
}

export const FirstRunNotice = ({ onDismiss }: FirstRunNoticeProps) => (
  <section className="notice">
    <div>
      <strong>RhythmLab помогает держать ритм для дыхания, фокуса, музыки и тренировок.</strong>
      <p>На телефоне звук запускается после нажатия Старт. Это нормально для мобильных браузеров.</p>
    </div>
    <button type="button" onClick={onDismiss}>
      Понятно
    </button>
  </section>
);
