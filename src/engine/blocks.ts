export type Face = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz'

export type BlockDef = {
  name: string
  top: string
  side: string
  bottom: string
  faces?: Partial<Record<Face, string>>
  shape: 'cube' | 'cross'
  cutout?: boolean
  emissive?: boolean
  water?: boolean
}

const defs: BlockDef[] = [{ name: 'air', top: 'dirt', side: 'dirt', bottom: 'dirt', shape: 'cube' }]

function add(name: string, opts: Partial<BlockDef> & { all?: string } = {}) {
  const all = opts.all ?? name
  defs.push({ name, top: opts.top ?? all, side: opts.side ?? all, bottom: opts.bottom ?? opts.top ?? all, faces: opts.faces, shape: opts.shape ?? 'cube', cutout: opts.cutout, emissive: opts.emissive, water: opts.water })
}

add('grass', { top: 'grass_top', side: 'grass_side', bottom: 'dirt' })
add('dirt'); add('stone'); add('cobblestone'); add('stone_bricks'); add('polished_andesite'); add('sky_stone'); add('deepslate'); add('sand'); add('gravel')
add('path', { top: 'path', side: 'dirt', bottom: 'dirt' })
add('oak_log', { top: 'oak_log_top', side: 'oak_log' })
add('dark_log', { top: 'oak_log_top', side: 'dark_log' })
add('oak_planks'); add('dark_planks')
add('oak_leaves', { cutout: true }); add('dark_leaves', { cutout: true }); add('hedge')
add('glass', { cutout: true })
add('andesite_casing'); add('brass_casing'); add('brass_block'); add('copper_block'); add('copper_roof')
add('me_drive', { side: 'me_drive', top: 'me_side', emissive: true }); add('me_side')
add('me_controller', { emissive: true }); add('fluix', { emissive: true })
add('jukebox', { top: 'jukebox_top', side: 'jukebox_side' }); add('note_block')
add('bookshelf', { side: 'bookshelf', top: 'oak_planks' })
add('mycelium', { top: 'mycelium_top', side: 'mycelium_side', bottom: 'dirt' })
add('mushroom_red'); add('mushroom_brown'); add('mushroom_stem')
add('glowstone', { emissive: true }); add('lamp', { emissive: true })
add('iron_block'); add('gold_block'); add('diamond_block')
add('beacon', { emissive: true })
add('obsidian'); add('end_stone')
add('end_frame', { top: 'end_frame_top', side: 'end_frame_side', bottom: 'end_stone' })
add('sculk', { emissive: true })
add('crafting_table', { top: 'crafting_top', side: 'crafting_side', bottom: 'oak_planks' })
add('furnace', { all: 'cobblestone', faces: { pz: 'furnace_front' } })
add('hay', { top: 'hay_top', side: 'hay_side' })
add('farmland', { top: 'farmland', side: 'dirt', bottom: 'dirt' })
add('coal_ore'); add('iron_ore'); add('diamond_ore'); add('redstone_ore')
add('bricks'); add('white_wool'); add('red_wool'); add('agar'); add('colony_green'); add('colony_pink'); add('colony_blue'); add('quartz')
add('water', { water: true })
add('tall_grass', { shape: 'cross', cutout: true }); add('fern', { shape: 'cross', cutout: true })
add('poppy', { shape: 'cross', cutout: true }); add('dandelion', { shape: 'cross', cutout: true }); add('cornflower', { shape: 'cross', cutout: true })
add('firefly_bush', { shape: 'cross', cutout: true, emissive: true })
add('red_mushroom_small', { shape: 'cross', cutout: true })
add('wheat', { shape: 'cross', cutout: true }); add('cobweb', { shape: 'cross', cutout: true })

export const BLOCKS = defs
export const B: Record<string, number> = Object.fromEntries(defs.map((d, i) => [d.name, i]))

/** Solid cubes hide the faces of their neighbours. */
export const OPAQUE = new Uint8Array(defs.map(d => (d.name !== 'air' && d.shape === 'cube' && !d.cutout && !d.water ? 1 : 0)))
/** Anything the player can stand on. */
export const SOLID = new Uint8Array(defs.map(d => (d.name !== 'air' && d.shape === 'cube' && !d.water ? 1 : 0)))

export function faceTile(def: BlockDef, face: Face) {
  return def.faces?.[face] ?? (face === 'py' ? def.top : face === 'ny' ? def.bottom : def.side)
}
