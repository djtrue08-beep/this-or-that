export const questions = [
  { id: "f001", mode: "family", text: "Which power would you rather have?", a: "Fly anywhere, but only at walking speed", b: "Teleport anywhere, but arrive wearing a clown costume" },
  { id: "f002", mode: "family", text: "Which strange roommate would you prefer?", a: "A talking gorilla", b: "A dinosaur that thinks it's a dog" },
  { id: "f003", mode: "family", text: "Which deal would you take?", a: "Receive $1 million today", b: "Receive $5,000 every month for life" },
  { id: "f004", mode: "family", text: "Which would you rather have following you everywhere?", a: "A personal marching band", b: "A comedian narrating your life" },
  { id: "f005", mode: "family", text: "Which would you rather fight?", a: "100 duck-sized horses", b: "One horse-sized duck" },
  { id: "f006", mode: "family", text: "Which inconvenient superpower would you choose?", a: "Understand every animal but they all complain", b: "Read minds but only during sneezes" },
  { id: "f007", mode: "family", text: "Which would you rather wear to school or work?", a: "A superhero cape every day", b: "A crown every day" },
  { id: "f008", mode: "family", text: "Which vacation sounds more fun?", a: "Sleep in a treehouse", b: "Sleep in an underwater hotel" },
  { id: "f009", mode: "family", text: "Which pet would you rather have?", a: "A miniature elephant", b: "A giant rabbit" },
  { id: "f010", mode: "family", text: "Which would you rather never need again?", a: "Sleep", b: "Charging your devices" },
  { id: "a001", mode: "adult", text: "Which would you rather know?", a: "Every lie your partner has told you", b: "Everything your partner's friends say about you" },
  { id: "a002", mode: "adult", text: "Which would you rather have exposed?", a: "Your entire search history", b: "Your last 100 text messages" },
  { id: "a003", mode: "adult", text: "Which date disaster is worse?", a: "They bring their parent to dinner", b: "They talk about their ex all night" },
  { id: "a004", mode: "adult", text: "Which deal would you take?", a: "$1 million and your search history goes public", b: "$100,000 and nobody asks questions" },
  { id: "a005", mode: "adult", text: "Which embarrassing mistake would you rather make?", a: "Send a flirty message to your boss", b: "Call your date by your ex's name" },
  { id: "a006", mode: "adult", text: "Which would you rather lose for a month?", a: "Social media", b: "Streaming services" }
];
export function shuffled(items) {
  const copy = [...items];
  for (let i=copy.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}
