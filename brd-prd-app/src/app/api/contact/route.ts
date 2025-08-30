import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { name, email, subject, message, type } = await req.json();

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const validTypes = ['general', 'support', 'sales', 'technical', 'billing'];
    const contactType = validTypes.includes(type) ? type : 'general';

    // Create contact request
    const contactRequest = await prisma.contactRequest.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        type: contactType,
        userId: session?.user?.id || null,
        status: 'open',
        priority: 'medium', // Default priority
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      contactId: contactRequest.id,
    });

  } catch (error: any) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin users to retrieve contact requests
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, adminPermissions: true }
    });

    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (priority) whereClause.priority = priority;

    const contactRequests = await prisma.contactRequest.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'desc' }, // Show urgent/high priority first
        { createdAt: 'desc' }  // Then by creation date
      ],
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            subscriptionTier: true,
          },
        },
      },
    });

    const total = await prisma.contactRequest.count({
      where: whereClause,
    });

    return NextResponse.json({
      contacts: contactRequests,
      total,
      hasMore: offset + limit < total,
    });

  } catch (error: any) {
    console.error('Contact requests retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve contact requests' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { contactId, status, response, priority } = await req.json();

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (response) {
      updateData.response = response;
      updateData.respondedAt = new Date();
      updateData.respondedBy = session.user.id;
    }
    if (priority) updateData.priority = priority;

    const updatedContact = await prisma.contactRequest.update({
      where: { id: contactId },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: session.user.id,
        action: 'respond_contact',
        targetId: contactId,
        details: {
          status: status || 'no_change',
          hasResponse: !!response,
          priority: priority || 'no_change',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contact request updated successfully',
      contact: updatedContact,
    });

  } catch (error: any) {
    console.error('Contact request update error:', error);
    return NextResponse.json(
      { error: 'Failed to update contact request' },
      { status: 500 }
    );
  }
}