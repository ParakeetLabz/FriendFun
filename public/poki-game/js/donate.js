import { icons } from './icons.js?v=1aa0a4d3';
// 💝 Donate page (#/donate): FunTopia is free and stays free. Donations are
// a voluntary way for families who love FunTopia to help keep it running —
// they pay for the website name and keeping the site online and safe.
// The Donate button opens the donation page in a new tab. Donating never
// buys anything in the game.
const DONATE_URL = 'https://venmo.com/u/FunTopia?txn=pay&note=Donation';
export function donatePage(D) {
  D.mount('donate', `
    <h1><span class="ic">${icons.gift}</span> Donate to FunTopia</h1>
    <p class="muted">FunTopia is free to play, and it will stay free. Donating is a way for families who love FunTopia to help keep it running — totally your choice, never required.</p>
    <section><div class="sec-h"><h2>What donations pay for</h2></div>
      <ul class="donate-list">
        <li><b>The FunTopia website name</b> — so players can find us at funtopiagame.com instead of a long, hard-to-remember link.</li>
        <li><b>Keeping the game online</b> — the computers that run FunTopia day and night so everyone can play.</li>
        <li><b>Keeping FunTopia safe</b> — the safety checks and moderators that protect players.</li>
      </ul>
    </section>
    <section><div class="sec-h"><h2>What donations do NOT buy</h2></div>
      <p>Donating does not buy FunTix, items, or any advantage in the game. Everyone plays fair, whether they donate or not. FunTopia is never pay-to-win.</p>
    </section>
    <section><div class="sec-h"><h2>Donate</h2></div>
      <p><a class="btn-primary" href="${DONATE_URL}" target="_blank" rel="noopener">Donate</a></p>
      <p class="muted">If you'd like to help keep FunTopia running, you can donate. Every bit helps, and it's totally your choice.</p>
    </section>
  `);
}
