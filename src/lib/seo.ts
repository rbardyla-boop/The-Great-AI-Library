export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} · The Great AI Library` },
      { name: "description", content: description },
    ],
  };
}
