import { drizzle } from 'drizzle-orm/postgres-js';
import { Hono } from 'hono'
import postgres from 'postgres';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono()
const client = postgres(process.env.POSTGRES_URL || panic());
const db = drizzle(client);

type User = {
  name: string;
  email: string;
  image: string;
  alumni: boolean;
  gradYr: string;
  proofOfGrad: string;
  currWorkplace: string;
  password: string;
}

app.get('/', (c) => c.text('Server Online!'))

app.get('/users', async (c) => {
  const usr = await db.select().from(users);
  return c.json(usr);
})

app.get('/users/alumni', async (c) => {
  const usr = await db.select().from(users).where(eq(users.alumni, true));
  return c.json(usr);
})

app.get('/users/students', async (c) => {
  const usr = await db.select().from(users).where(eq(users.alumni, false));
  return c.json(usr);
})

app.post('/users/register', async (c) => {
  const body: User = await c.req.json()
  const usr = await db.insert(users).values({
    ...body,
    verified: false
  });
  return c.text("Successfully added!");
})

app.post('/users/verify', async (c) => {
  const body: { id: number, token: string } = await c.req.json()
  if(body.token !== process.env.TOKEN) {
    c.status(401)
    return c.text("Invalid token")
  }
  const usr = await db.update(users).set({ verified: true }).where(eq(users.id, body.id));
  return c.text("Successfully verified!");
})

export default app

function panic() {
  console.error("POSTGRES_URL not set");
  process.exit(1);
  return ""; // unreachable code, but typescript doesn't know that. 🤷‍♂️ 🤷‍♀️ 🤷‍♂️ 🤷‍♀"
}