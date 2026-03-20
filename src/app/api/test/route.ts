import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, testHistory } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { callClaude, callGPT, callGemini } from '@/lib/ai/providers';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_MODELS = ['claude', 'gpt', 'gemini'] as const;
type ModelKey = (typeof VALID_MODELS)[number];

export async function POST(req: NextRequest) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { recipeId, model, instructions, testMessage } = body as Record<string, unknown>;

  // Validate inputs
  if (!recipeId || typeof recipeId !== 'string' || !UUID_REGEX.test(recipeId)) {
    return NextResponse.json({ error: 'Invalid recipeId' }, { status: 400 });
  }
  if (!model || !VALID_MODELS.includes(model as ModelKey)) {
    return NextResponse.json({ error: 'Invalid model. Must be claude, gpt, or gemini.' }, { status: 400 });
  }
  if (!instructions || typeof instructions !== 'string' || !instructions.trim()) {
    return NextResponse.json({ error: 'instructions is required' }, { status: 400 });
  }
  if (!testMessage || typeof testMessage !== 'string' || !testMessage.trim()) {
    return NextResponse.json({ error: 'testMessage is required' }, { status: 400 });
  }

  // Metering check
  const isAdmin = session.user.email === process.env.ADMIN_EMAIL;
  const isPaidSubscriber = session.user.subscriptionStatus === 'active';

  if (!isAdmin && !isPaidSubscriber) {
    const [user] = await db
      .select({ freeTestsRemaining: users.freeTestsRemaining })
      .from(users)
      .where(eq(users.id, userId));

    if (!user || user.freeTestsRemaining <= 0) {
      return NextResponse.json({ error: 'No tests remaining', requiresSubscription: true }, { status: 403 });
    }
  }

  // Call AI provider
  let aiResult: { content: string; model: string; tokensUsed?: number };
  try {
    if (model === 'claude') {
      aiResult = await callClaude(instructions.trim(), testMessage.trim());
    } else if (model === 'gpt') {
      aiResult = await callGPT(instructions.trim(), testMessage.trim());
    } else {
      aiResult = await callGemini(instructions.trim(), testMessage.trim());
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI provider error';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Insert test history
  await db.insert(testHistory).values({
    userId,
    recipeId,
    modelUsed: aiResult.model,
    responsePreview: aiResult.content.slice(0, 500),
  });

  // Decrement free tests if applicable
  let testsRemaining: number | null = null;
  if (!isAdmin && !isPaidSubscriber) {
    const [updated] = await db
      .update(users)
      .set({
        freeTestsRemaining: sql`${users.freeTestsRemaining} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ freeTestsRemaining: users.freeTestsRemaining });

    testsRemaining = updated?.freeTestsRemaining ?? 0;
  }

  return NextResponse.json({
    content: aiResult.content,
    model: aiResult.model,
    testsRemaining,
  });
}
