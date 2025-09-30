import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/documents - Fetch all documents for a session
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const documents = await prisma.generatedDocument.findMany({
      where: { sessionId },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST /api/documents - Create a new document
export async function POST(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const body = await req.json();
    const {
      type,
      title,
      description,
      status = 'draft',
      version,
      content,
      metadata
    } = body;

    if (!type || !title) {
      return NextResponse.json({ error: 'Type and title required' }, { status: 400 });
    }

    const document = await prisma.generatedDocument.create({
      data: {
        sessionId,
        type,
        title,
        description,
        status,
        version,
        content,
        metadata,
        generatedBy: 'gpt-5'
      }
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

// PATCH /api/documents/:id - Update a document
export async function PATCH(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    const body = await req.json();
    const updateData: any = {};

    // Only update fields that are provided
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.version !== undefined) updateData.version = body.version;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.fileUrl !== undefined) updateData.fileUrl = body.fileUrl;
    if (body.shareUrl !== undefined) updateData.shareUrl = body.shareUrl;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    const document = await prisma.generatedDocument.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

// DELETE /api/documents/:id - Delete a document
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    await prisma.generatedDocument.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
