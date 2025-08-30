import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { title, message, rating, category, email, name } = await req.json();

    // Validation
    if (!title || !message || !rating || !category) {
      return NextResponse.json(
        { error: 'Title, message, rating, and category are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const validCategories = ['feature', 'bug', 'improvement', 'praise', 'complaint'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // For anonymous feedback, email is required
    if (!session && !email) {
      return NextResponse.json(
        { error: 'Email is required for anonymous feedback' },
        { status: 400 }
      );
    }

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        rating,
        category,
        userId: session?.user?.id || null,
        email: !session ? email?.trim() : null,
        name: !session ? name?.trim() : null,
        status: 'pending',
        isPublic: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! We appreciate your input.',
      feedbackId: feedback.id,
    });

  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publicOnly = searchParams.get('public') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause = publicOnly 
      ? { status: 'approved', isPublic: true }
      : {};

    const feedback = await prisma.feedback.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    // Format feedback for public display
    const formattedFeedback = feedback.map(item => ({
      id: item.id,
      title: item.title,
      message: item.message,
      rating: item.rating,
      category: item.category,
      createdAt: item.createdAt,
      userName: item.user?.name || item.name || 'Anonymous',
      userImage: item.user?.image || null,
    }));

    return NextResponse.json({
      feedback: formattedFeedback,
      total: feedback.length,
    });

  } catch (error: any) {
    console.error('Feedback retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    );
  }
}