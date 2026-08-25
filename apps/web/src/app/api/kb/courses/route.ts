import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('metadata');

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        courses: ['CS101', 'CS102', 'MATH201', 'PHYS101']
      }, { status: 200 });
    }

    const courseSet = new Set<string>();
    for (const row of data) {
      if (row.metadata?.courseId && typeof row.metadata.courseId === 'string') {
        courseSet.add(row.metadata.courseId);
      }
    }

    const courses = Array.from(courseSet);
    if (courses.length === 0) {
      courses.push('CS101', 'CS102', 'MATH201', 'PHYS101');
    }

    return NextResponse.json({ courses }, { status: 200 });
  } catch (err) {
    return NextResponse.json({
      courses: ['CS101', 'CS102', 'MATH201', 'PHYS101']
    }, { status: 200 });
  }
}
