type AppProps = {
  entryLabel: "Participant entry" | "Venue entry";
};

export function App({ entryLabel }: AppProps) {
  return (
    <main>
      <h1>Memory Brewery</h1>
      <p>Local application foundation</p>
      <p>{entryLabel}</p>
    </main>
  );
}
