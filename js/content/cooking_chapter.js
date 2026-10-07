// Stable chapter identifiers: saved requests keep their accepted requirements and offer.
export const CHAPTER_PEOPLE = {
  mina: { name: 'Mina', portrait: 'cooking/mina_happy.png' },
  nell: { name: 'Bea', portrait: 'cooking/bea.png' },
  otis: { name: 'Rowan', portrait: 'cooking/rowan.png' }
};
export const RECIPES = [
  { id: 'soup', name: 'Garden Soup', dishId: 101, ingredients: [4, 5] },
  { id: 'tomato', name: 'Tomato Stew', dishId: 102, ingredients: [2, 6, 5] },
  { id: 'pumpkin', name: 'Pumpkin Mash', dishId: 103, ingredients: [1, 12, 5] }
];
export const DISH_ITEMS = RECIPES.map((recipe, index) => ({
  id: recipe.dishId, name: recipe.name, price: 0, type: 'dish', table_key: 'utility',
  image: `cooking/${['soup', 'stew', 'mash'][index]}.png`,
  harvestImage: `cooking/${['soup', 'stew', 'mash'][index]}.png`, goalLocked: true, growDays: 0
}));
export const STORY_REQUESTS = [
  { id: 'mina-experiment', person: 'mina', title: 'A little courage', requirements: [{ itemId: 4, quantity: 3, commonOnly: true }], dialogue: 'I keep a notebook of soups. Could I try three ordinary carrots? Fancy ones would make my first experiment too intimidating.', completion: 'It worked! A little sweeter than my notebook predicted. You helped me find my nerve.' },
  { id: 'mina-supper', person: 'mina', title: 'Supper for friends', requirements: [{ itemId: 2, quantity: 2 }, { itemId: 6, quantity: 1 }], dialogue: 'My friends are coming for supper. Two tomatoes and an onion will help me make something worth sharing.', completion: 'They asked for seconds. Someone even told the restaurant about me!' },
  { id: 'mina-trial', person: 'mina', title: 'The trial service', requirements: [{ itemId: 5, quantity: 3 }, { itemId: 4, quantity: 3 }, { itemId: 6, quantity: 2 }], dialogue: 'The restaurant offered me a trial service! Could you help with potatoes, carrots and onions? I want them to taste our little farm.', completion: 'They offered me the job! Come back tomorrow: I have something personal to give you.' }
];
export const POT_GIFT_DIALOGUE = 'The restaurant has its own equipment. This old pot helped me find my courage; now it is yours. Let me teach you three recipes. And I will still call on my favourite grower!';
export const MEAL_REQUESTS = [
  { id: 'nell-soup', person: 'nell', title: 'Lunch in the garden', requirements: [{ itemId: 101, quantity: 1 }], reward: 8, dialogue: ['I have been tending seedlings all morning. May I buy a garden soup for lunch?', 'A warm lunch between garden beds. One garden soup, please!'], completion: 'That warmed my hands right through. Back to my seedlings!' },
  { id: 'otis-stew', person: 'otis', title: 'Lunch between letters', requirements: [{ itemId: 102, quantity: 1 }], reward: 12, dialogue: ['My postal round smells wonderful today. May I buy a tomato stew?', 'The last stew kept me smiling up the hill. Another, please!'], completion: 'A sturdy lunch. Back to my letters!' },
  { id: 'nell-tomato', person: 'nell', title: 'A bright lunch', requirements: [{ itemId: 103, quantity: 1 }], reward: 40, dialogue: ['A pumpkin mash would brighten my rainy afternoon in the garden. May I buy one?', 'A bright pumpkin mash for a busy gardener, please!'], completion: 'Just the little lift I needed. Thank you!' }
];
