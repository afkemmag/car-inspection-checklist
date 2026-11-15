export interface CheckItem {
  id: string;
  title: string;
  /** How to check it / what to look for. */
  hint: string;
  /** A failure here is a likely deal-breaker. */
  critical?: boolean;
}

export interface Section {
  id: string;
  /** Japanese label shown as the big section mark. */
  jp: string;
  /** Romanized reading. */
  romaji: string;
  title: string;
  /** Short note about when/how to do this stage. */
  when: string;
  items: CheckItem[];
}

export const sections: Section[] = [
  {
    id: 'docs',
    jp: '書類',
    romaji: 'Shorui',
    title: 'Paperwork & History',
    when: 'Before you go see the car',
    items: [
      { id: 'docs-research', title: 'Research known problems for this model/year', hint: 'Look up common failures, recalls and expensive repairs (owner forums, reliability reports) so you know what to look for.' },
      { id: 'docs-history', title: 'Vehicle history report pulled', hint: 'Carfax / AutoCheck: accidents, number of owners, use (rental, fleet), odometer readings over time.' },
      { id: 'docs-title', title: 'Clean title in the seller\'s name', hint: 'No salvage, rebuilt, flood or lemon brand. Name on title matches the seller\'s ID.', critical: true },
      { id: 'docs-vin', title: 'VIN matches everywhere', hint: 'Dashboard plate, driver door-jamb sticker, title and registration all show the same VIN.', critical: true },
      { id: 'docs-lien', title: 'No outstanding lien / loan', hint: 'Confirm the car is paid off or the lender payoff process is clear.' },
      { id: 'docs-recalls', title: 'Open recalls checked', hint: 'Run the VIN through the manufacturer / NHTSA recall lookup.' },
      { id: 'docs-service', title: 'Service records available', hint: 'Regular oil changes, timing belt, transmission fluid, coolant, brakes. Gaps = ask why.' },
      { id: 'docs-odometer', title: 'Mileage is consistent', hint: 'Odometer agrees with history report and service records, and with wear on pedals/wheel/seat.', critical: true },
      { id: 'docs-keys', title: 'All keys, fobs & manuals', hint: 'Count the keys and fobs, wheel-lock key, owner\'s manual. Replacements can be expensive.' },
      { id: 'docs-why', title: 'Ask why they are selling', hint: 'Also ask: any accidents, known issues, warning lights, modifications? Compare answers with what you find.' },
    ],
  },
  {
    id: 'exterior',
    jp: '外装',
    romaji: 'Gaisō',
    title: 'Body & Paint',
    when: 'Daylight, dry car, walk all the way around',
    items: [
      { id: 'ext-stance', title: 'Car sits level', hint: 'From 3–4 m away: no corner sagging, body lines straight down each side.' },
      { id: 'ext-ripples', title: 'No ripples or waves in panels', hint: 'Crouch and look down the length of each side at an angle. Wavy reflections = bodywork.' },
      { id: 'ext-color', title: 'Paint color matches on every panel', hint: 'Compare bumpers, doors, fenders, hood under daylight. Slight shade differences = repaint.' },
      { id: 'ext-gaps', title: 'Even panel gaps', hint: 'Gaps around hood, doors, trunk and bumpers should be even left-to-right. Run a finger along them.' },
      { id: 'ext-overspray', title: 'No overspray or tape lines', hint: 'Check rubber seals, trim, door-jamb edges and under the hood for paint mist or masking edges.' },
      { id: 'ext-filler', title: 'No body filler', hint: 'Use a paint thickness gauge or a fridge magnet wrapped in cloth on lower panels: weak spots = filler.' },
      { id: 'ext-bolts', title: 'Fender / hood / door bolts untouched', hint: 'Wrench marks or broken paint on bolt heads means panels were removed or replaced.' },
      { id: 'ext-rust', title: 'No structural rust', hint: 'Wheel arches, rocker panels, door bottoms, tailgate, around the windshield. Bubbling paint hides rust.', critical: true },
      { id: 'ext-glass', title: 'Glass free of cracks & chips', hint: 'Check the windshield in the wiper area. Different brand/date stamps on windows may indicate replacement after an accident.' },
      { id: 'ext-lights', title: 'Light lenses clear', hint: 'No cracks, fogging or moisture inside. One brand-new headlight on an old car = front hit.' },
      { id: 'ext-openings', title: 'Doors, hood & trunk open/close right', hint: 'Smooth hinges, latches catch first time, hood/trunk struts hold.' },
      { id: 'ext-seals', title: 'Weatherstripping intact', hint: 'Seals not torn or perished. Water stains near seals = leaks.' },
      { id: 'ext-trunk-well', title: 'Spare-wheel well dry and straight', hint: 'Lift the trunk floor. Water, rust, mud or wrinkled metal here = flood or rear impact.', critical: true },
    ],
  },
  {
    id: 'wheels',
    jp: '足回り',
    romaji: 'Ashimawari',
    title: 'Tires, Wheels & Brakes',
    when: 'Check every corner, steering turned for the fronts',
    items: [
      { id: 'tire-tread', title: 'Enough tread depth', hint: 'At least 4/32" (3 mm). Use a tread gauge or the penny/coin test.' },
      { id: 'tire-wear', title: 'Even tread wear', hint: 'Inner/outer edge wear = alignment or bent suspension. Cupping = worn shocks.' },
      { id: 'tire-age', title: 'Tires are not too old', hint: 'Read the DOT date code (WWYY). Over ~6 years old should be replaced regardless of tread.' },
      { id: 'tire-match', title: 'Matching tires (brand & size)', hint: 'Mismatched tires are a sign of cheap upkeep; on AWD they can damage the drivetrain.' },
      { id: 'tire-wheels', title: 'Wheels not bent or cracked', hint: 'Curb rash is cosmetic; bends, cracks or welds in the rim are not.' },
      { id: 'tire-spare', title: 'Spare, jack & tools present', hint: 'Spare tire inflated, jack, lug wrench, wheel-lock key.' },
      { id: 'brake-rotors', title: 'Brake rotors in good shape', hint: 'Look through the spokes: no deep grooves, heavy lip at the edge, or heat cracks.' },
      { id: 'brake-pads', title: 'Brake pads have material', hint: 'Roughly 3 mm+ of pad left. Metal-on-metal grinding marks are bad.' },
      { id: 'susp-bounce', title: 'Bounce test passes', hint: 'Push down hard on each corner: it should rebound once and settle, not keep bouncing.' },
    ],
  },
  {
    id: 'engine',
    jp: 'エンジン',
    romaji: 'Enjin',
    title: 'Under the Hood',
    when: 'Engine COLD — check before the seller starts it',
    items: [
      { id: 'eng-cold', title: 'Engine is cold on arrival', hint: 'Touch the hood and radiator hose. A pre-warmed engine can hide hard starts, smoke and noises.', critical: true },
      { id: 'eng-clean', title: 'Bay not suspiciously power-washed', hint: 'A spotless bay on an old car may be hiding leaks. Normal light dust is fine.' },
      { id: 'eng-oil', title: 'Oil level & condition OK', hint: 'On the dipstick between marks; amber to dark brown. Milky/foamy = possible head gasket failure.', critical: true },
      { id: 'eng-oilcap', title: 'No sludge under the oil cap', hint: 'Thick black sludge = poor maintenance. Mayonnaise-like residue = coolant mixing.' },
      { id: 'eng-coolant', title: 'Coolant level & color OK', hint: 'Check the reservoir only when cold. Clean color, no oil film or rusty sludge.', critical: true },
      { id: 'eng-trans-fluid', title: 'Transmission fluid OK', hint: 'If there is a dipstick: red/pink, not dark brown, and not smelling burnt.' },
      { id: 'eng-brake-fluid', title: 'Brake fluid level & color', hint: 'Between min/max; light amber. Very dark = overdue for a flush.' },
      { id: 'eng-ps-fluid', title: 'Power steering fluid', hint: 'At level, no foam, no leaks around the pump or rack (if hydraulic).' },
      { id: 'eng-belts', title: 'Belts not cracked or glazed', hint: 'Serpentine/accessory belts: no cracks, fraying or shiny glazed surface.' },
      { id: 'eng-hoses', title: 'Hoses firm, no bulges', hint: 'Squeeze radiator and heater hoses: not mushy, swollen or cracked at the clamps.' },
      { id: 'eng-leaks', title: 'No oil or coolant leaks', hint: 'Use a flashlight around valve cover, head gasket line, oil pan, water pump, radiator.' },
      { id: 'eng-battery', title: 'Battery healthy', hint: 'Clean terminals (no crusty corrosion), date code under ~4–5 years, hold-down fitted.' },
      { id: 'eng-filter', title: 'Air filter reasonably clean', hint: 'A filthy filter is a quick indicator of overall neglect.' },
      { id: 'eng-mods', title: 'Modifications & abuse signs noted', hint: 'Aftermarket intake, turbo, tune, hacked wiring, missing engine covers. Ask what was done and by whom.' },
    ],
  },
  {
    id: 'underbody',
    jp: '下回り',
    romaji: 'Shitamawari',
    title: 'Underbody & Suspension',
    when: 'Flashlight and a mat — or on a lift at a shop',
    items: [
      { id: 'under-frame', title: 'Frame rails straight', hint: 'No kinks, crumples, fresh welds, clamp marks or new paint on the rails — signs of a major hit.', critical: true },
      { id: 'under-rust', title: 'No rot on floor / subframe', hint: 'Surface rust is normal; flaking, holes or soft metal on floor pans, subframe or jacking points are not.', critical: true },
      { id: 'under-scrapes', title: 'No heavy scraping damage', hint: 'Crushed oil pan, torn splash shields, bent crossmembers = curbed, lowered or hard driven.' },
      { id: 'under-exhaust', title: 'Exhaust system solid', hint: 'No holes, heavy rust, broken hangers. Catalytic converter is present.' },
      { id: 'under-cv', title: 'CV boots not torn', hint: 'Rubber boots behind the front wheels: torn boot with grease sprayed around = CV joint soon.' },
      { id: 'under-shocks', title: 'Shocks / struts not leaking', hint: 'Oily wet film on the shock body means it is worn out.' },
      { id: 'under-bushings', title: 'Bushings & joints OK', hint: 'Control arm bushings not cracked, ball joints and tie-rod boots intact.' },
      { id: 'under-lines', title: 'Brake & fuel lines OK', hint: 'No heavy corrosion or wet spots along the lines.' },
      { id: 'under-diff', title: 'Diff / transfer case dry', hint: 'RWD/AWD: check the differential and transfer case for leaks.' },
      { id: 'under-drips', title: 'No fresh drips on the ground', hint: 'Look at where the car was parked: oil (brown/black), coolant (green/pink, sweet), trans fluid (red).' },
    ],
  },
  {
    id: 'interior',
    jp: '内装',
    romaji: 'Naisō',
    title: 'Interior & Cabin',
    when: 'Sit in every seat, use your nose',
    items: [
      { id: 'int-smell', title: 'No bad smells', hint: 'Mildew/must = water. Smoke is hard to remove. Heavy air freshener may be masking something.' },
      { id: 'int-flood', title: 'No flood damage signs', hint: 'Silt or rust under carpets, on seat rails and bolts; water line in door cards; dirty seatbelt at full extension.', critical: true },
      { id: 'int-wear', title: 'Wear matches the mileage', hint: 'Steering wheel, shift knob, pedals and driver seat bolster. Worn smooth on "low mileage" car = suspect.' },
      { id: 'int-seats', title: 'Seats adjust and lock', hint: 'All directions, power and manual, heated/cooled if equipped. No tears.' },
      { id: 'int-belts', title: 'Seatbelts work', hint: 'Every belt latches, releases and retracts smoothly.' },
      { id: 'int-airbags', title: 'Airbags intact', hint: 'SRS light comes on at key-on then off. Covers not mismatched or loose.', critical: true },
      { id: 'int-headliner', title: 'Headliner clean, no sag', hint: 'Water stains around the sunroof or pillars = leak.' },
      { id: 'int-carpet', title: 'Carpets dry', hint: 'Press down in the footwells and trunk: damp = leaking seals, heater core or sunroof drains.' },
      { id: 'int-dash', title: 'Dash & trim intact', hint: 'No cracks, missing trim, or screwdriver marks around the cluster (odometer tampering).' },
    ],
  },
  {
    id: 'electrical',
    jp: '電装',
    romaji: 'Densō',
    title: 'Electrical & Features',
    when: 'Key on, engine off — then again running',
    items: [
      { id: 'elec-bulbcheck', title: 'All warning lights do a bulb check', hint: 'At key-on, check engine, ABS, SRS, oil and battery lights should all light briefly. One that never lights may have been disabled.', critical: true },
      { id: 'elec-obd', title: 'OBD2 scan clean', hint: 'Plug in a cheap scanner: no stored/pending codes, and readiness monitors "ready" (not recently cleared).', critical: true },
      { id: 'elec-ac', title: 'A/C blows cold, heat blows hot', hint: 'Test all fan speeds, vents and modes, plus front and rear defrost.' },
      { id: 'elec-windows', title: 'Windows, locks & mirrors', hint: 'Every window up/down, all door locks, power mirrors, child locks.' },
      { id: 'elec-lights', title: 'All exterior lights work', hint: 'Low/high beams, fogs, turn signals, hazards, brake lights (ask someone), reverse, plate light.' },
      { id: 'elec-wipers', title: 'Wipers & washers', hint: 'All speeds, front and rear, washer jets spray.' },
      { id: 'elec-infotainment', title: 'Infotainment & audio', hint: 'Screen, every speaker, Bluetooth pairing, USB, backup camera, sensors.' },
      { id: 'elec-horn', title: 'Horn works', hint: 'Quick tap.' },
      { id: 'elec-sunroof', title: 'Sunroof / convertible top', hint: 'Opens and closes fully, seals, drains not clogged.' },
      { id: 'elec-fob', title: 'Key fob functions', hint: 'Lock/unlock, trunk, remote start, keyless entry on each fob.' },
    ],
  },
  {
    id: 'coldstart',
    jp: '始動',
    romaji: 'Shidō',
    title: 'Cold Start',
    when: 'You turn the key, someone watches the exhaust',
    items: [
      { id: 'cs-crank', title: 'Starts quickly', hint: 'Should fire within a couple of seconds. Long cranking = fuel, ignition or compression issues.' },
      { id: 'cs-smoke', title: 'No colored exhaust smoke', hint: 'Blue = burning oil. Thick white & sweet smell = coolant/head gasket. Black = running rich. Thin vapor on a cold day is OK.', critical: true },
      { id: 'cs-noise', title: 'No knocks, ticks or rattles', hint: 'Listen at the front of the engine: chain rattle on startup, lifter tick, deep knock from the bottom end.', critical: true },
      { id: 'cs-idle', title: 'Idle smooth & settles', hint: 'RPM rises on cold start then settles; no hunting, shaking or stalling.' },
      { id: 'cs-cel', title: 'Warning lights go off', hint: 'All dash warning lights turn off within a few seconds of starting.' },
      { id: 'cs-tailpipe', title: 'Tailpipe check', hint: 'Wipe inside the tailpipe: heavy oily black soot = oil burning.' },
    ],
  },
  {
    id: 'testdrive',
    jp: '試乗',
    romaji: 'Shijō',
    title: 'Test Drive',
    when: '20+ minutes: city, highway, bumps, parking lot',
    items: [
      { id: 'td-engage', title: 'Gear engagement smooth', hint: 'Shift P → R → N → D with foot on brake: quick engagement, no heavy clunk or long delay.' },
      { id: 'td-shifts', title: 'Transmission shifts cleanly', hint: 'No slipping, flaring RPM, harsh or late shifts, up and down through all gears.', critical: true },
      { id: 'td-clutch', title: 'Clutch & gearbox (manual)', hint: 'Bite point not at the very top; no slip in a high gear at low RPM; no grinding into gears.' },
      { id: 'td-power', title: 'Pulls smoothly, no hesitation', hint: 'Steady acceleration through the rev range. Stumbles or jerks = misfire.' },
      { id: 'td-brakes', title: 'Brakes straight & quiet', hint: 'No pulling, pedal pulsation, squeal or grinding. Pedal firm, not spongy.' },
      { id: 'td-steering', title: 'Steering tracks straight', hint: 'Wheel centered going straight, no pull, no excessive play or vague feel.' },
      { id: 'td-suspension', title: 'No clunks over bumps', hint: 'Drive over speed bumps and rough road. Clunks, rattles or floaty feel = worn parts.' },
      { id: 'td-highway', title: 'Stable at highway speed', hint: 'No vibration in wheel or seat at 90–110 km/h (55–70 mph).' },
      { id: 'td-hum', title: 'No humming or whining', hint: 'A hum that changes when weaving = wheel bearing. Whine with RPM = pump/alternator/diff.' },
      { id: 'td-lock', title: 'Full-lock turns are quiet', hint: 'Slow tight circles in a parking lot both ways: clicking = CV joint, groaning = steering.' },
      { id: 'td-temp', title: 'Temperature stays normal', hint: 'Gauge reaches the middle and stays there, including at idle after the drive.' },
      { id: 'td-cruise', title: 'Cruise control & driver aids', hint: 'Cruise, lane assist, parking sensors, traction control light not stuck on.' },
    ],
  },
  {
    id: 'deal',
    jp: '決断',
    romaji: 'Ketsudan',
    title: 'After the Drive & Deal',
    when: 'Before any money changes hands',
    items: [
      { id: 'deal-recheck', title: 'Re-check after driving', hint: 'Look under the car for new drips, smell for burning oil/coolant, warning lights still off.' },
      { id: 'deal-ppi', title: 'Independent mechanic inspection (PPI)', hint: 'Have a shop you choose put it on a lift. A seller who refuses this is a red flag.', critical: true },
      { id: 'deal-price', title: 'Price checked against market', hint: 'Compare similar mileage/trim listings and valuation guides.' },
      { id: 'deal-estimates', title: 'Repair costs estimated', hint: 'Total up everything marked NG. Use it to negotiate or walk away.' },
      { id: 'deal-bill', title: 'Bill of sale & title signed properly', hint: 'Price, date, VIN, both signatures. Title signed over correctly, odometer disclosed.' },
      { id: 'deal-insurance', title: 'Insurance quote ready', hint: 'Get the quote before you buy, especially for sporty or modified cars.' },
    ],
  },
];

export const totalItems = sections.reduce((n, s) => n + s.items.length, 0);
