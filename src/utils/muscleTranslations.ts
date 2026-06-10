export const translateMuscleToSpanish = (muscle: string | null | undefined): string => {
  if (!muscle) return '';
  const translations: Record<string, string> = {
    'Abdominals': 'Abdominales',
    'Chest': 'Pecho',
    'Shoulders': 'Hombros',
    'Biceps': 'Bíceps',
    'Triceps': 'Tríceps',
    'Lats': 'Espalda (Dorsales)',
    'Middle Back': 'Espalda Media',
    'Lower Back': 'Espalda Baja',
    'Quadriceps': 'Cuádriceps',
    'Hamstrings': 'Femorales / Isquiotibiales',
    'Glutes': 'Glúteos',
    'Calves': 'Gemelos',
    'Forearms': 'Antebrazos',
    'Traps': 'Trapecio',
    'Neck': 'Cuello',
    'Adductors': 'Aductores',
    'Abductors': 'Abductores'
  };
  return translations[muscle] || muscle;
};
