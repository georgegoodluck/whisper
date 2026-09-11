"use client";
import { motion } from "framer-motion";
import {
  MessageCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface QuestionWithAnswer {
  id: string;
  content: string;
  created_at: string;
  is_answered: boolean;
  device_id: string;
  is_hidden?: boolean;
  answers?: {
    id: string;
    content: string;
    created_at: string;
    admin_name: string;
  }[];
}

export function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function QuestionCard({
  q,
  isMine,
  onOpen,
}: {
  q: QuestionWithAnswer;
  isMine?: boolean;
  onOpen: (q: QuestionWithAnswer) => void;
}) {
  const answer = q.answers?.[0];
  const preview =
    q.content.length > 160 ? q.content.slice(0, 160) + "…" : q.content;

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(q)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group relative text-left rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all h-full flex flex-col"
    >
      {/* Answered accent */}
      {q.is_answered && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 to-primary" />
      )}

      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
        <MessageCircle className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground/70">Anonymous</span>
        <span>·</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {timeAgo(q.created_at)}
        </span>
        {isMine && (
          <Badge
            variant="outline"
            className="text-[10px] border-primary/40 text-primary ml-auto"
          >
            You
          </Badge>
        )}
      </div>

      <p className="text-[15px] leading-relaxed text-foreground/95 break-words line-clamp-4 flex-1">
        {preview}
      </p>

      <div className="mt-4 flex items-center justify-between">
        {q.is_answered ? (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Answered
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-muted-foreground border-border"
          >
            Awaiting answer
          </Badge>
        )}
        {answer && (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            by {answer.admin_name}
          </span>
        )}
      </div>
    </motion.button>
  );
}
