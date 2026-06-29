import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/payment-methods";

export function PaymentMethodFields({
  method,
  onMethodChange,
  note,
  onNoteChange,
  methodId = "payment-method",
  noteId = "payment-note",
}: {
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  note: string;
  onNoteChange: (note: string) => void;
  methodId?: string;
  noteId?: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={methodId}>Payment method</Label>
        <Select value={method} onValueChange={(value) => onMethodChange(value as PaymentMethod)}>
          <SelectTrigger id={methodId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={noteId}>Note (optional)</Label>
        <Input
          id={noteId}
          placeholder="Add details if needed"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
        />
      </div>
    </>
  );
}
