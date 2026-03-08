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
    const isPdf = fileType === "application/pdf";
    const isDoc = fileType?.includes("word") || fileType?.includes("document") || fileType?.includes("msword");
    const isSpreadsheet = fileType?.includes("sheet") || fileType?.includes("excel") || fileType?.includes("csv");
    const isTextBased = fileType?.includes("text") || fileType?.includes("json") || fileType?.includes("xml") || fileType?.includes("csv");

    let fileContent = "";
    let fileBase64 = "";
    let useVisionModel = false;

    if (!downloadError && fileData) {
      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      if (isImage) {
        // Images always use vision model for OCR
        useVisionModel = true;
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        fileBase64 = btoa(binary);
        console.log(`Image converted to base64, size: ${fileBase64.length} chars`);
      } else if (isPdf) {
        // PDFs: Send as base64 to vision model for full OCR (handles scanned PDFs)
        useVisionModel = true;
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        fileBase64 = btoa(binary);
        console.log(`PDF converted to base64, size: ${fileBase64.length} chars`);

        // Also try to extract raw text for text-based PDFs as supplementary data
        try {
          const textDecoder = new TextDecoder("utf-8", { fatal: false });
          const rawText = textDecoder.decode(bytes);
          // Extract readable strings from PDF binary (text between parentheses or after Tj/TJ operators)
          const textMatches = rawText.match(/\(([^)]{2,})\)/g);
          if (textMatches) {
            fileContent = textMatches
              .map(m => m.slice(1, -1))
              .filter(t => /[a-zA-Z0-9\u0900-\u097F]{2,}/.test(t))
              .join(" ")
              .substring(0, 5000);
          }
        } catch {
          // Ignore - vision model will handle it
        }
      } else if (isTextBased) {
        // Plain text files - read directly
        const textDecoder = new TextDecoder("utf-8", { fatal: false });
        fileContent = textDecoder.decode(bytes).substring(0, 15000);
      } else if (isDoc || isSpreadsheet) {
        // Office docs: Try to extract text, also send to vision model for better extraction
        useVisionModel = true;
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        fileBase64 = btoa(binary);

        // Try basic text extraction from XML-based office formats
        try {
          const textDecoder = new TextDecoder("utf-8", { fatal: false });
          const rawText = textDecoder.decode(bytes);
          const textMatches = rawText.match(/>([^<]{3,})</g);
          if (textMatches) {
            fileContent = textMatches
              .map(m => m.slice(1, -1))
              .filter(t => /[a-zA-Z0-9\u0900-\u097F]{2,}/.test(t))
              .join(" ")
              .substring(0, 8000);
          }
        } catch {
          // Vision model will handle it
        }
      } else {
        // Unknown binary - try text extraction
        try {
          const textDecoder = new TextDecoder("utf-8", { fatal: false });
          fileContent = textDecoder.decode(bytes).substring(0, 8000);
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
7. **extracted_text is THE MOST CRITICAL field**: Extract EVERY readable word, line, number, and text fragment from the document or image. For images, perform thorough OCR - capture ALL text visible in the image including headers, body text, captions, watermarks, stamps, handwritten text, numbers, dates, and any text in any language. For PDFs, extract EVERY line of text from EVERY page. This field is the PRIMARY source for in-text search. Include the raw text as-is without paraphrasing. Users will search by typing dates like "15/03/1999" or names or any text fragment - everything must be captured here.
8. For dates found in documents (like date of birth, issue date, etc.), include them in EVERY format: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, "15 March 1999", "March 15, 1999", "15/03/99". This ensures date searches work regardless of format.

**PHOTO & IMAGE ANALYSIS (VERY IMPORTANT FOR PHOTOS):**
9. For any photo/image containing PEOPLE, describe each person in detail:
   - Apparent gender, age range, build, hair color/style, skin tone
   - Clothing: color, type (shirt, dress, suit, traditional wear like saree, kurta, etc.)
   - Facial features: glasses, beard, mustache, smile, expression
   - Pose: standing, sitting, selfie, group photo, portrait, candid
   - If the person's name appears in the filename (e.g., "shreyas_photo.jpg"), associate the name with the person description
10. For EVERY photo/image, describe the SCENE and BACKGROUND exhaustively:
   - Location type: indoor (office, home, restaurant, mall), outdoor (park, beach, mountains, hills, city street, temple, garden)
   - Landscape: hills, mountains, ocean, river, lake, forest, desert, fields, sky, sunset, sunrise, clouds
   - Weather/lighting: sunny, cloudy, rainy, golden hour, night, artificial lighting
   - Setting elements: buildings, vehicles, trees, flowers, furniture, food, animals
   - Event context: wedding, birthday, party, trip, vacation, picnic, graduation, festival (Diwali, Holi, etc.)
   - Photo style: selfie, group photo, portrait, landscape, candid, professional, casual
11. Include ALL scene/person descriptions in BOTH the summary AND semantic_keywords fields, using many synonyms. E.g. "hills" should also include "mountains, hillside, hilly terrain, pahad, mountain range, elevated terrain, highland".`;


    const userMessages: any[] = [];
    
    // Determine MIME type for vision model
    const visionMime = isPdf ? "application/pdf" : fileType;

    if (useVisionModel && fileBase64) {
      const supplementaryText = fileContent 
        ? `\n\nSupplementary extracted text (may be partial): ${fileContent}` 
        : "";

      userMessages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this ${isPdf ? "PDF document" : isDoc ? "document" : isImage ? "image" : "file"} thoroughly. Extract ALL text using OCR. Capture every word, number, date, name, address, and any text content you can see - even partial or handwritten text. This is critical for search functionality.

File Name: ${fileName}
MIME Type: ${fileType}
${supplementaryText}

CRITICAL: The "extracted_text" field must contain EVERY piece of text from this ${isPdf ? "document (all pages)" : "image"}, line by line, exactly as it appears. Do not summarize or paraphrase - extract the raw text. Include ALL dates in multiple formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, written out). This is the most important field for search. Users might search for a date of birth, a name, an amount - everything must be captured.`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${visionMime};base64,${fileBase64}`,
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
Content (first 15000 chars): ${fileContent || "[No text content available - analyze based on filename and type]"}

CRITICAL: The "extracted_text" field must contain ALL key text from this document verbatim - every heading, paragraph, key phrases, names, numbers, dates, and identifiers. Users will search by typing remembered lines of text, dates (in any format), names, amounts - so include as much raw text as possible. Include ALL dates in multiple formats. Do not summarize - extract the actual text.`,
      });
    }

    // Use vision-capable model for all visual content
    const model = useVisionModel ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
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
                    description: "ALL readable text from the document or image, extracted verbatim line by line. For images: every word visible via OCR. For PDFs: every line from every page. For documents: all text content. Include dates in multiple formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, written out). This is the PRIMARY field for in-text search - users will search by typing any remembered text. Maximum detail." 
                  },
                  semantic_keywords: {
                    type: "string",
                    description: "Generate 30-50 semantic keywords, synonyms, related concepts, alternate phrasings, and category terms separated by commas. Include: synonyms in English and Hindi/regional languages, abbreviations and full forms, conceptual relatives, document category terms, date-related terms. E.g. for an Aadhaar card: 'aadhaar, aadhar, uid, unique identification, identity card, ID proof, government ID, date of birth, DOB, janam tithi, address proof, pata pramaan'. This powers meaning-based semantic search.",
                  },
                  entities: {
                    type: "array",
                    description: "ALL entities found in the document or image. Extract every name, date, number, amount, ID, phone, email, address.",
                    items: {
                      type: "object",
                      properties: {
                        type: { 
                          type: "string", 
                          enum: ["person", "company", "date", "amount", "id_number", "phone", "email", "address", "pan", "gst", "aadhaar", "passport", "policy_number", "invoice_number", "account_number", "dob", "issue_date", "expiry_date_entity"],
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
                required: ["tags", "summary", "ai_description", "expiry_date", "extracted_text", "semantic_keywords", "entities"],
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
        semantic_keywords: metadata.semantic_keywords || "",
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
