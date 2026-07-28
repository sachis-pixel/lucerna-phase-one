/** Real-world connection cards — grounds each stage's concept in a true case. */

export interface RealWorldFact {
  emoji: string;
  title: string;
  body: string;
}

export const STAGE1_FACTS: RealWorldFact[] = [
  {
    emoji: "🛑",
    title: "Stickers fooled a self-driving car",
    body: "A few stickers on a real stop sign fooled a self-driving car's AI into reading \"45 mph speed limit\" — while people still saw STOP. Same trick you just did: change the features, not the object."
  },
  {
    emoji: "👓",
    title: "Glasses that beat face recognition",
    body: "A patterned pair of glasses made face-recognition AI confidently name the wearer as someone else. The face never changed — only what the AI measured."
  }
];

export const STAGE2_FACTS: RealWorldFact[] = [
  {
    emoji: "🩺",
    title: "A skin-cancer AI learned the wrong feature",
    body: "A skin-cancer AI secretly keyed on the ruler doctors place next to dangerous moles — not the mole itself. It just added up whatever showed up most in its training photos."
  },
  {
    emoji: "🐺",
    title: "The husky that was really about snow",
    body: "A famous image AI \"recognised\" huskies mostly by the snow behind them, not the dog. Show it a husky on grass, and it failed."
  }
];

export const STAGE3_FACTS: RealWorldFact[] = [
  {
    emoji: "⚖️",
    title: "A chatbot invented fake court cases",
    body: "A lawyer asked an AI for legal cases. It confidently produced six detailed cases — none of which existed. It wasn't lying; it was just outputting its most likely next words."
  },
  {
    emoji: "🎲",
    title: "Why the same question gives different answers",
    body: "Ask a chatbot the same question twice — you'll often get different answers. It samples from likely next words, like a slot machine weighted by its training."
  }
];

export const STAGE4_FACTS: RealWorldFact[] = [
  {
    emoji: "💬",
    title: "A chatbot poisoned in a single day",
    body: "A company released a chatbot that learned from public messages. Within 24 hours, people flooded it with hateful text — and it started repeating them. Exactly what you just did to these birds."
  },
  {
    emoji: "🧹",
    title: "Why big models are hard to poison",
    body: "Big AI companies train on huge amounts of clean, filtered data — a little junk gets drowned out. Same reason Sir Bytealot's Guardian Seal held. More clean data beats a little dirty data."
  }
];
