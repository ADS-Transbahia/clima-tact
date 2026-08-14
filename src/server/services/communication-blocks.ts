import type { SupabaseClient } from "@supabase/supabase-js";

export type BlockType = "text" | "image" | "file" | "button" | "checklist";

export const BLOCK_TYPE_LABEL: Record<BlockType, string> = {
  text: "Texto",
  image: "Imagem",
  file: "Arquivo para download",
  button: "Botão de ação",
  checklist: "Checklist",
};

export type CommunicationBlock = {
  id: string;
  order: number;
  type: BlockType;
  config: Record<string, string | string[]>;
};

export async function listBlocks(
  supabase: SupabaseClient,
  communicationId: string,
): Promise<CommunicationBlock[]> {
  const { data, error } = await supabase
    .from("communication_blocks")
    .select("id, order, type, config")
    .eq("communication_id", communicationId)
    .order("order", { ascending: true });

  if (error) throw error;
  return data;
}

export type BlockInput = {
  type: BlockType;
  config: Record<string, string | string[]>;
};

export async function addBlock(
  supabase: SupabaseClient,
  communicationId: string,
  order: number,
  input: BlockInput,
) {
  const { error } = await supabase.from("communication_blocks").insert({
    communication_id: communicationId,
    order,
    type: input.type,
    config: input.config,
  });
  if (error) throw error;
}

export async function deleteBlock(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("communication_blocks").delete().eq("id", id);
  if (error) throw error;
}
