import { links } from '../content'
import { Logo } from './Logo'
import { McButton, PixelIcon } from './gui'
import { navigate } from './router'

export function TitleScreen({ reduced, status }: { reduced: boolean; status: 'loading' | 'ready' | 'failed' }) {
  return (
    <main id="main-content" className="title-screen">
      <h1 className="sr-only">Noel Alex, data science student and systems builder</h1>
      <Logo reduced={reduced} />
      <nav className="title-menu" aria-label="Main menu">
        <McButton onClick={() => navigate({ screen: 'world' })} disabled={status !== 'ready'} autoFocus>{status === 'ready' ? 'Singleplayer' : status === 'loading' ? 'Generating world…' : 'Singleplayer needs WebGL'}</McButton>
        <McButton onClick={() => navigate({ screen: 'multiplayer' })}>Multiplayer</McButton>
        <McButton onClick={() => navigate({ screen: 'mods' })}>Mods</McButton>
        <div className="title-row">
          <McButton size="icon" href={links.resume} external label="Resume (PDF)"><PixelIcon name="book" size={20} /></McButton>
          <McButton size="half" onClick={() => navigate({ screen: 'options' })}>Options…</McButton>
          <McButton size="half" onClick={() => navigate({ screen: 'work' })}>Open to Work</McButton>
          <McButton size="icon" href={links.github} external label="GitHub"><PixelIcon name="code" size={20} /></McButton>
        </div>
      </nav>
      <footer className="title-footer">
        <span>Noel Alex · CS (Data Science) · VIT Vellore ’27</span>
        <span>Fan-made. Not affiliated with Mojang or Microsoft.</span>
      </footer>
    </main>
  )
}
