
export const THEME = {
  deepBlue: '#0a192f',
  electricCyan: '#00d4ff',
  glacialWhite: '#e6f1ff',
  vividViolet: '#7b4dff',
};

export const INITIAL_CATEGORIES = [
  { id: 'cat-3em', name: '3ème', parentId: null },
  { id: 'cat-term', name: 'Terminale', parentId: null },
  { id: 'cat-3em-math', name: 'Mathématique', parentId: 'cat-3em' },
  { id: 'cat-3em-phys', name: 'Physique', parentId: 'cat-3em' },
  { id: 'cat-term-philo', name: 'Philosophie', parentId: 'cat-term' },
];

export const INITIAL_DOCUMENTS = [
  {
    id: 'doc-1',
    title: 'Cours Algèbre',
    description: 'Introduction aux bases de l\'algèbre pour le niveau 3ème.',
    categoryId: 'cat-3em-math',
    githubUrl: 'https://raw.githubusercontent.com/leonemmanuel6247/SuccessPolaris/main/docs/3em/Mathematique/Cours_Algebre.pdf',
    downloads: 124,
    dateAdded: '2023-10-15',
  },
  {
    id: 'doc-2',
    title: 'Notions Éthique',
    description: 'Cours complet sur les notions d\'éthique en terminale.',
    categoryId: 'cat-term-philo',
    githubUrl: 'https://raw.githubusercontent.com/leonemmanuel6247/SuccessPolaris/main/docs/Terminale/Philosophie/Notions_Ethique.pdf',
    downloads: 85,
    dateAdded: '2023-11-02',
  }
];
