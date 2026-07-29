import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const job = await db.jobs.findById(params.id);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  return NextResponse.json({
    status: job.status,
    data: job.result
  });
}
