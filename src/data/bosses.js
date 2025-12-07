export function initialBosses() {
  return {
    chest: {
      id: 'chest',
      name: 'Chest Beast',
      maxHP: 8000,
      currentHP: 8000,
      elemental: 'fire',
      muscles: ['chest', 'shoulders'],
    },
    glute: {
      id: 'glute',
      name: 'Glute Dragon',
      maxHP: 10000,
      currentHP: 10000,
      elemental: 'earth',
      muscles: ['glutes', 'legs'],
    },
    back: {
      id: 'back',
      name: 'Row Titan',
      maxHP: 9000,
      currentHP: 9000,
      elemental: 'water',
      muscles: ['back'],
    },
  }
}
