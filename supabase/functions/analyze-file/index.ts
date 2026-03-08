import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { fileId, fileName, fileType } = await req.json();
    if (!fileId || !fileName) throw new Error("Missing fileId or fileName");

    // Download the file from storage
    const filePath = `${user.id}/${fileName}`;
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("files")
      .download(filePath);

    const isImage = fileType?.startsWith("image/");
    let fileContent = "";
    let imageBase64 = "";

    if (!downloadError && fileData) {
      if (isImage) {
        // Convert image to base64 for vision model
        try {
          const arrayBuffer = await fileData.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          imageBase64 = btoa(binary);
          console.log(`Image converted to base64, size: ${imageBase64.length} chars`);
        } catch (e) {
          console.error("Image base64 conversion error:", e);
        }
      } else if (fileType === "application/pdf" || fileType?.includes("text") || fileType?.includes("document")) {
        try {
          fileContent = await fileData.text();
          fileContent = fileContent.substring(0, 8000);
        } catch {
          fileContent = `[Binary file: ${fileName}]`;
        }
      }
    }

    // Build messages based on file type
    const systemPrompt = `You are an expert document analysis AI for Sortify, a smart file management system. Your job is to extract MAXIMUM useful metadata from every document and image.

CRITICAL RULES:
1. Generate a COMPREHENSIVE summary (5-8 sentences) that captures ALL key information. Include specific numbers, names, dates, amounts found in the document.
2. The summary must be searchable - include synonyms and related terms. E.g. for an invoice, mention "bill", "payment", "receipt" as well.
3. Extract EVERY entity you can find: person names, company names, dates, monetary amounts, ID numbers (PAN, GST, Aadhaar, SSN, passport numbers), phone numbers, email addresses, addresses.
4. For the AI description, write a natural language sentence that someone might use to search for this document. Think: "What would a user type to find this?"
5. Detect expiry dates, renewal dates, due dates - any future date that matters.
6. Tags should cover ALL relevant categories. Be generous with tags.
7. **extracted_text is CRITICAL for search**: Extract EVERY readable word, line, number, and text fragment from the document or image. For images, perform thorough OCR - capture ALL text visible in the image including headers, body text, captions, watermarks, stamps, handwritten text, numbers, dates, and any text in any language. This field is the PRIMARY source for in-text search. Include the raw text as-is without paraphrasing.`;

    const userMessages: any[] = [];

    if (isImage && imageBase64) {
      // Use vision model for images
      userMessages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this image thoroughly. Extract ALL text visible in the image using OCR. Capture every word, number, date, name, address, and any text content you can see - even partial or handwritten text. This is critical for search functionality.

File Name: ${fileName}
MIME Type: ${fileType}

IMPORTANT: The "extracted_text" field must contain EVERY piece of text visible in this image, line by line, exactly as it appears. Do not summarize or paraphrase - extract the raw text. This is the most important field for search.`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${fileType};base64,${imageBase64}`,
            },
          },
        ],
      });
    } else {
      userMessages.push({
        role: "user",
        content: `Analyze this file thoroughly:
Name: ${fileName}
MIME Type: ${fileType}
Content (first 8000 chars): ${fileContent || "[No text content available - analyze based on filename and type]"}

IMPORTANT: The "extracted_text" field must contain ALL key text from this document verbatim - every heading, paragraph opener, key phrases, names, numbers, dates, and identifiers. Users will search by typing remembered lines of text, so include as much raw text as possible. Do not summarize - extract the actual text.`,
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: isImage ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...userMessages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_metadata",
              description: "Extract comprehensive structured metadata from a document or image",
              parameters: {
                type: "object",
                properties: {
                  tags: {
                    type: "array",
                    description: "All relevant tags. Be generous - include primary category, subcategories, and related topics",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Tag name from: Invoice, Contract, Travel, Insurance, Work, Personal, Finance, Health, Legal, Tax, ID Document, Medical, Receipt, Agreement, Report, Letter, Certificate, License, Warranty, Subscription, Bill, Statement, Memo, Policy, Photo, Screenshot, Scan, Handwritten" },
                        confidence: { type: "number", minimum: 0, maximum: 1 },
                      },
                      required: ["name", "confidence"],
                      additionalProperties: false,
                    },
                  },
                  summary: { 
                    type: "string", 
                    description: "Comprehensive 5-8 sentence summary. Include ALL key details: names, dates, amounts, ID numbers, key terms. Add synonyms and related search terms at the end." 
                  },
                  ai_description: { 
                    type: "string", 
                    description: "Natural language description written as a search query someone would use to find this document. Include alternative phrasings." 
                  },
                  expiry_date: { 
                    type: "string", 
                    nullable: true, 
                    description: "ISO date string of any expiry/renewal/due date found, or null." 
                  },
                  extracted_text: { 
                    type: "string", 
                    description: "ALL readable text from the document or image, extracted verbatim line by line. For images: every word visible via OCR. For documents: key text passages, headings, identifiers, numbers. This is the PRIMARY field for in-text search - users will search by typing remembered lines. Maximum detail." 
                  },
                  semantic_keywords: {
                    type: "string",
                    description: "Generate 30-50 semantic keywords, synonyms, related concepts, alternate phrasings, and category terms separated by commas. Include: synonyms in English and Hindi/regional languages, abbreviations and full forms, conceptual relatives, document category terms. E.g. for an insurance policy: 'insurance, policy, premium, coverage, claim, bima, surety, protection, indemnity, underwriting, renewal, health plan, medical coverage, life insurance, term plan'. This powers meaning-based semantic search.",
                  },
                  entities: {
                    type: "array",
                    description: "ALL entities found in the document or image",
                    items: {
                      type: "object",
                      properties: {
                        type: { 
                          type: "string", 
                          enum: ["person", "company", "date", "amount", "id_number", "phone", "email", "address", "pan", "gst", "aadhaar", "passport", "policy_number", "invoice_number", "account_number"],
                          description: "Entity type" 
                        },
                        value: { type: "string", description: "The entity value as found in the document" },
                        label: { type: "string", description: "Human readable label" },
                      },
                      required: ["type", "value", "label"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tags", "summary", "ai_description", "expiry_date", "extracted_text", "entities"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_metadata" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const metadata = JSON.parse(toolCall.function.arguments);

    // Update the file record with AI metadata
    const { error: updateError } = await supabase
      .from("files")
      .update({
        ai_summary: metadata.summary,
        ai_description: metadata.ai_description,
        extracted_text: metadata.extracted_text,
        expiry_date: metadata.expiry_date || null,
        entities: metadata.entities || [],
      })
      .eq("id", fileId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update file metadata");
    }

    // Insert tags
    for (const tag of metadata.tags) {
      const { data: tagData, error: tagError } = await supabase
        .from("tags")
        .upsert({ name: tag.name }, { onConflict: "name" })
        .select("id")
        .single();

      if (tagError || !tagData) {
        console.error("Tag upsert error:", tagError);
        continue;
      }

      await supabase.from("file_tags").upsert(
        { file_id: fileId, tag_id: tagData.id, confidence: tag.confidence },
        { onConflict: "file_id,tag_id" }
      );
    }

    return new Response(JSON.stringify({ success: true, metadata }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-file error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
