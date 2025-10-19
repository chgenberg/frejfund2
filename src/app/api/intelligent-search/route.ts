import { NextRequest, NextResponse } from 'next/server';
import { intelligentSearch } from '@/lib/intelligent-search';
import { BusinessInfo } from '@/types/business';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, businessInfo, conversationState, question, answer } = body;

    switch (action) {
      case 'initialize': {
        const state = intelligentSearch.initializeConversation(businessInfo as BusinessInfo);
        const firstQuestion = await intelligentSearch.getNextQuestion(state, businessInfo);

        return NextResponse.json({
          success: true,
          conversationState: state,
          question: firstQuestion,
        });
      }

      case 'next_question': {
        const nextQuestion = await intelligentSearch.getNextQuestion(
          conversationState,
          businessInfo as BusinessInfo,
        );

        return NextResponse.json({
          success: true,
          question: nextQuestion,
        });
      }

      case 'process_answer': {
        const updatedState = await intelligentSearch.processAnswer(
          conversationState,
          question,
          answer,
          businessInfo as BusinessInfo,
        );

        const nextQuestion = await intelligentSearch.getNextQuestion(
          updatedState,
          businessInfo as BusinessInfo,
        );

        return NextResponse.json({
          success: true,
          conversationState: updatedState,
          question: nextQuestion,
          isComplete: intelligentSearch.isReadyForAnalysis(updatedState),
        });
      }

      case 'finalize': {
        const analysis = await intelligentSearch.generateFinalAnalysis(
          conversationState,
          businessInfo as BusinessInfo,
        );

        return NextResponse.json({
          success: true,
          analysis,
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Intelligent search error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
