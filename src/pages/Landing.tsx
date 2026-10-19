export function Landing() {
  return (
    <main>
      <section className="hero">
        <h1>Savings circles where the rules are enforced by code, not by trust.</h1>
        <p>
          Ajo, susu, chama, tanda: millions of people save in rotating groups where everyone pays in each round and one
          member takes the pot. It works until someone stops paying, or the person holding the cash disappears.
          Ajo Circle runs the same circle on Stellar Testnet so that the pot is held by a Soroban contract, every payment is
          public, and each member&apos;s deposit covers what they owe.
        </p>
        <p><a className="button primary" href="#/create">Start a circle</a> <a className="button" href="#/circles">Browse circles</a></p>
      </section>
      <section aria-labelledby="how">
        <h2 id="how">How it works</h2>
        <ol className="steps">
          <li><strong>Create.</strong> The organizer lists the members in payout order and sets the contribution and round length.</li>
          <li><strong>Join.</strong> Each member locks a deposit of (members − 1) × contribution. When the last one joins, the circle starts.</li>
          <li><strong>Pay.</strong> Each round, everyone except that round&apos;s recipient pays the contribution.</li>
          <li><strong>Settle.</strong> Anyone can settle once everyone paid, or after the deadline plus grace. Missing payments are taken from the defaulter&apos;s deposit, so the recipient is always paid in full.</li>
          <li><strong>Claim.</strong> Recipients claim their pot; leftover deposits are returned when the circle completes.</li>
        </ol>
      </section>
      <section aria-labelledby="need">
        <h2 id="need">Before you start</h2>
        <ul>
          <li>Install the <a href="https://www.freighter.app/" target="_blank" rel="noreferrer">Freighter</a> wallet and switch it to <strong>Testnet</strong>.</li>
          <li>Fund your Testnet account with free test XLM from <a href="https://lab.stellar.org/account/create" target="_blank" rel="noreferrer">Stellar Lab</a>.</li>
          <li>This is unaudited software running on a test network. Do not use real funds.</li>
        </ul>
      </section>
    </main>
  );
}
