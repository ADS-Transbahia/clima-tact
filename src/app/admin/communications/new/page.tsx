import { CommunicationForm } from "../CommunicationForm";
import { createCommunicationAction } from "../actions";

export default function NewCommunicationPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-neutral-500">Nova comunicação</h2>
      <CommunicationForm action={createCommunicationAction} />
    </div>
  );
}
