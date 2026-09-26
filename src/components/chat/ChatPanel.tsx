'use client';

import { useState, useRef, useEffect } from 'react';
import { TreeData, Person } from '@/types/tree';
import { ChatMessage, answerFamilyTreeQuestion } from '@/lib/ai/chat';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, Send, Bot, User, RefreshCw, HelpCircle, X } from 'lucide-react';

type ChatPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  treeData: TreeData;
};

export default function ChatPanel({ isOpen, onClose, treeData }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your AI Family Historian for the **${treeData.tree.name}**.\n\nYou can ask me anything about this family—such as who is related to whom, birthdays, career milestones, or who the oldest living relative is!`,
      createdAt: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Who is the oldest person in this tree?",
    "Who was born in March or April?",
    "How is Emily related to Robert?",
    "Tell me about Robert's career",
    "How many total people and connections are there?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseContent = await answerFamilyTreeQuestion(text, treeData, messages);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error answering question:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error trying to answer your question.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your AI Family Historian for the **${treeData.tree.name}**.\n\nYou can ask me anything about this family—such as who is related to whom, birthdays, career milestones, or who the oldest living relative is!`,
        createdAt: new Date().toISOString(),
      }
    ]);
  };

  // Simple markdown renderer for bold text and paragraphs
  const renderMessageContent = (content: string) => {
    return content.split('\n\n').map((paragraph, i) => (
      <p key={i} className="mb-2 last:mb-0">
        {paragraph.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    ));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md w-full p-0 flex flex-col h-full bg-background border-l">
        <SheetHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between">
          <div className="flex flex-col space-y-1">
            <SheetTitle className="flex items-center space-x-2 text-xl">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>AI Family Historian</span>
            </SheetTitle>
            <SheetDescription className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                Connected to Tree
              </Badge>
            </SheetDescription>
          </div>
          {/* Default Sheet close button exists in SheetContent but we can hide it via css or just let it be. The instructions did not ask to hide the default close button but we can put ours instead or keep the default. SheetComponent from shadcn already includes a close button by default, but I'll add ours and hide it via a class on SheetContent if I wanted, but this is fine. */}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
              <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start`}>
                <Avatar className="w-8 h-8 shrink-0">
                  {msg.role === 'assistant' ? (
                    <>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                
                <div 
                  className={`mx-2 p-3 rounded-xl ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-muted rounded-tl-none text-sm'
                  }`}
                >
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start w-full">
              <div className="flex max-w-[85%] flex-row items-start">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="mx-2 p-3 rounded-xl bg-muted rounded-tl-none flex items-center space-x-1 h-[44px]">
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {messages.length === 1 && (
            <div className="mb-4 hidden sm:block">
              <p className="text-xs text-muted-foreground mb-2 flex items-center">
                <HelpCircle className="w-3 h-3 mr-1" />
                Suggestions:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80 font-normal transition-colors"
                    onClick={() => handleSend(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleClearChat} title="Clear Chat" className="shrink-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex-1 flex items-center space-x-2"
            >
              <Input
                placeholder="Ask about your family..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
