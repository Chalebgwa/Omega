import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

const TARGET_COUNT = 50
const DEFAULT_BATCH = 'botswana-rants-v1'
const DEFAULT_EMAIL = 'soapbox.seed.bot@theend-96.app'
const DEFAULT_PASSWORD = 'BotswanaSeed!2026'
const DEFAULT_NAME = 'The Botswana Rant Desk'

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const cleaned = line.trim()
    if (!cleaned || cleaned.startsWith('#')) continue
    const equalsIndex = cleaned.indexOf('=')
    if (equalsIndex === -1) continue
    const key = cleaned.slice(0, equalsIndex).trim()
    let value = cleaned.slice(equalsIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

function pick(items, index, offset = 0) {
  return items[(index + offset) % items.length]
}

const places = [
  'Gaborone',
  'Francistown',
  'Maun',
  'Palapye',
  'Molepolole',
  'Serowe',
  'Lobatse',
  'Kanye',
  'Mochudi',
  'Mahalapye',
]

const mentalTitles = [
  'I am tired of pretending burnout is normal at work',
  'Commuting anxiety in traffic is draining us before 9 a.m.',
  'Students are smiling in class and breaking in private',
  'Men are told to be strong until they collapse',
  'Therapy still feels like a luxury in Botswana',
  'Postpartum sadness is being dismissed as mood',
  'Nurses are exhausted and nobody checks on them',
  'Social media pressure is cooking our self-esteem',
  'Grief support disappears after the funeral',
  'Customer service workers are absorbing daily disrespect',
  'Faith spaces need to treat mental health seriously',
  'Teachers are overloaded and emotionally spent',
  'Unemployment anxiety is killing confidence',
  'Family caregivers are burning out in silence',
  'Panic attacks are being called attitude',
  'Night-shift workers are living in brain fog',
  'Debt shame is fueling depression quietly',
  'Loneliness in busy cities is very real',
  'Young moms are drowning behind brave faces',
  'Teen anxiety needs early support, not lectures',
  'Sleep deprivation is a public mental-health issue',
  'Breakups plus money stress are sending people into spirals',
  'Perfection culture is making people emotionally fake',
  'Online humiliation is creating real panic',
  'Freelancers have no off-switch and no support',
  'Mental leave should be normal sick leave',
  'Job hunting stress is becoming identity stress',
  'Care workers are expected to pour from empty cups',
  'Silence around trauma is hurting entire families',
  'We need community spaces where people can talk honestly',
]

const communityTitles = [
  'Load shedding is wrecking small business plans',
  'Potholes are now part of normal driving strategy',
  'Rent keeps rising faster than salaries',
  'Combi chaos is a daily stress multiplier',
  'Data bundles are too expensive for students',
  'Water cuts are reshaping whole family routines',
  'Young creatives are underpaid and overworked',
  'Street lighting gaps make evenings feel unsafe',
  'Public queues still waste entire workdays',
  'Food prices are no longer realistic',
  'Youth sports talent needs real structure',
  'Accessibility is still treated like an optional add-on',
  'Libraries and study spaces are missing in many towns',
  'Vendors keep getting moved without enough consultation',
  'Nightlife cleanup pressure is unfairly distributed',
  'Farmers are carrying climate risk mostly alone',
  'Apprenticeships should be easier to find',
  'Local artists need consistent stages, not one-off events',
  'Public offices need better digital systems',
  'Neighborhood safety should not depend on luck',
]

const tswanaBits = [
  'Ga go bonolo.',
  'Tota re tshwanetse go bua nnete.',
  'Batho ba me, re lapile.',
  'Ke kopa re utlwane.',
  'Ga se drama, ke nnete.',
  'A re dire betere.',
]

const openers = [
  'I am saying this with my full chest today.',
  'Ke bua straight today, no sugar-coating.',
  'Someone has to say this out loud.',
  'I have held this in for too long.',
  'This one is not a hot take, it is daily life.',
]

const closers = [
  'Silence is costing us too much.',
  'Compassion has to become policy.',
  'This should be fixable if we are honest.',
  'Respect people before systems fail completely.',
  'We can do better than this.',
]

function buildArticle(title, category, index) {
  const place = pick(places, index)
  const tswanaA = pick(tswanaBits, index)
  const tswanaB = pick(tswanaBits, index, 2)
  const opener = pick(openers, index)
  const closer = pick(closers, index, 1)
  const isMental = category === 'mental_health'
  const tagLine = isMental ? '#MentalHealth #Botswana #SoapBox' : '#Botswana #SoapBox #Community'

  return {
    title: `${title} (${place})`,
    content: [
      `## Rant From ${place}`,
      '',
      `${opener} In ${place}, this keeps showing up in normal conversations and private voice notes.`,
      '',
      `What frustrates me is how fast people normalize it instead of fixing it. ${tswanaA}`,
      '',
      '- We keep treating symptoms like personality flaws.',
      '- We keep asking people to adjust to broken systems.',
      '- We keep delaying obvious fixes because "that is how it is".',
      '',
      `I am not posting this for pity. I am posting this because this is affecting real people every day. ${tswanaB}`,
      '',
      `> "I am trying my best, but this pace is not humane anymore."`,
      '',
      `${closer}`,
      '',
      tagLine,
    ].join('\n'),
    place,
  }
}

async function loginOrCreate(auth, email, password) {
  try {
    const signedIn = await signInWithEmailAndPassword(auth, email, password)
    return signedIn.user
  } catch {
    // Fall through and try account creation.
  }

  try {
    const created = await createUserWithEmailAndPassword(auth, email, password)
    return created.user
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/email-already-in-use') {
      throw new Error(`Seed account ${email} already exists. Set SOAPBOX_SEED_PASSWORD to that account's password.`)
    }
    throw error
  }
}

async function seed() {
  loadEnv(path.join(process.cwd(), '.env'))

  const config = {
    apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
    authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requireEnv('VITE_FIREBASE_APP_ID'),
  }

  const seedEmail = process.env.SOAPBOX_SEED_EMAIL ?? DEFAULT_EMAIL
  const seedPassword = process.env.SOAPBOX_SEED_PASSWORD ?? DEFAULT_PASSWORD
  const seedName = process.env.SOAPBOX_SEED_NAME ?? DEFAULT_NAME
  const seedBatch = process.env.SOAPBOX_SEED_BATCH ?? DEFAULT_BATCH

  const app = initializeApp(config)
  const auth = getAuth(app)
  const db = getFirestore(app)
  console.log('Initializing Firebase seed run...')
  const seedUser = await loginOrCreate(auth, seedEmail, seedPassword)
  console.log(`Authenticated seed user: ${seedUser.uid}`)

  await setDoc(
    doc(db, 'users', seedUser.uid),
    { name: seedName, email: seedEmail.toLowerCase(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  )

  const entriesRef = collection(db, 'entries')
  const publicEntries = await getDocs(query(entriesRef, where('isPublic', '==', true)))
  const existingBatchDocs = publicEntries.docs.filter((item) => item.data().seedBatch === seedBatch)
  console.log(`Existing docs in batch ${seedBatch}: ${existingBatchDocs.length}`)
  const existingIndexes = new Set(
    existingBatchDocs.map((item) => Number(item.data().seedIndex)).filter((n) => Number.isFinite(n)),
  )

  const scenarios = [
    ...mentalTitles.map((title) => ({ title, category: 'mental_health' })),
    ...communityTitles.map((title) => ({ title, category: 'community' })),
  ].slice(0, TARGET_COUNT)

  const nextEntryDate = new Date()
  nextEntryDate.setDate(nextEntryDate.getDate() + 30)

  const batch = writeBatch(db)
  let inserted = 0
  for (let i = 0; i < scenarios.length; i += 1) {
    const seedIndex = i + 1
    if (existingIndexes.has(seedIndex)) continue

    const scenario = scenarios[i]
    const article = buildArticle(scenario.title, scenario.category, i)

    const entryRef = doc(entriesRef)
    batch.set(entryRef, {
      title: article.title,
      content: article.content,
      type: 'text',
      videoUrl: null,
      isPublic: true,
      isAnonymous: i % 4 !== 0,
      entryInterval: 30,
      nextEntryDate: Timestamp.fromDate(nextEntryDate),
      authorId: seedUser.uid,
      authorName: seedName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      seedBatch,
      seedIndex,
      seedCategory: scenario.category,
      seedPlace: article.place,
    })
    inserted += 1
  }

  if (inserted > 0) {
    await batch.commit()
  }

  const mentalCount = scenarios.filter((s) => s.category === 'mental_health').length
  console.log(`Seed batch: ${seedBatch}`)
  console.log(`Inserted this run: ${inserted}`)
  console.log(`Total batch now: ${existingBatchDocs.length + inserted}`)
  console.log(`Mental-health posts in batch: ${mentalCount}`)
}

seed()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to seed soap box posts.')
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
