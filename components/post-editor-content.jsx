"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Sparkles, Wand2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { generateBlogContent, improveContent } from "@/app/actions/gemini";
import { BarLoader } from "react-spinners";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

if (typeof window !== "undefined") {
  import("react-quill-new/dist/quill.snow.css");
}

const quillConfig = {
  modules: {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["link", "blockquote", "code-block"],
        [
          { list: "ordered" },
          { list: "bullet" },
          { indent: "-1" },
          { indent: "+1" },
        ],
        ["image", "video"],
      ],
      handlers: { image: function () {} },
    },
  },
  formats: [
    "header",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "align",
    "link",
    "blockquote",
    "code-block",
    "list",
    "indent",
    "image",
    "video",
  ],
};

export default function PostEditorContent({
  form,
  setQuillRef,
  onImageUpload,
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);

  const getQuillModules = () => ({
    ...quillConfig.modules,
    toolbar: {
      ...quillConfig.modules.toolbar,
      handlers: { image: () => onImageUpload("content") },
    },
  });

  const handleAI = async (type, improvementType = null) => {
    const { title, content, category, tags } = watchedValues;

    if (type === "generate") {
      if (!title?.trim())
        return toast.error("Please add a title before generating content");
      if (
        content &&
        content !== "<p><br></p>" &&
        !window.confirm("This will replace your existing content. Continue?")
      )
        return;
      setIsGenerating(true);
    } else {
      if (!content || content === "<p><br></p>")
        return toast.error("Please add some content before improving it");
      setIsImproving(true);
    }

    try {
      const result =
        type === "generate"
          ? await generateBlogContent(title, category, tags || [])
          : await improveContent(content, improvementType);

      if (result.success) {
        setValue("content", result.content);
        toast.success(
          `Content ${type === "generate" ? "generated" : improvementType + "d"} successfully!`
        );
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error(`Failed to ${type} content. Please try again.`);
    } finally {
      type === "generate" ? setIsGenerating(false) : setIsImproving(false);
    }
  };

  const hasTitle = watchedValues.title?.trim();
  const hasContent =
    watchedValues.content && watchedValues.content !== "<p><br></p>";

  return (
    <>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-5">
          {/* Featured Image */}
          {watchedValues.featuredImage ? (
            <div className="relative group">
              <img
                src={watchedValues.featuredImage}
                alt="Featured"
                className="w-full h-80 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center space-x-3">
                <Button
                  onClick={() => onImageUpload("featured")}
                  variant="secondary"
                  size="sm"
                >
                  Change Image
                </Button>
                <Button
                  onClick={() => setValue("featuredImage", "")}
                  variant="destructive"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onImageUpload("featured")}
              className="w-full h-36 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center space-y-4 hover:border-slate-500 transition-colors group"
            >
              <ImageIcon className="h-12 w-12 text-slate-400 group-hover:text-slate-300" />
              <div className="text-center">
                <p className="text-slate-300 text-lg font-medium">
                  Add a featured image
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Upload and transform with AI
                </p>
              </div>
            </button>
          )}

          {/* Title */}
          <div>
            <Input
              {...register("title")}
              placeholder="Post title..."
              className="border-0 text-4xl font-bold bg-transparent placeholder:text-slate-500 text-white p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ fontSize: "2.5rem", lineHeight: "1.2" }}
            />
            {errors.title && (
              <p className="text-red-400 mt-2">{errors.title.message}</p>
            )}
          </div>

          {/* AI Tools */}
          <div>
            {!hasContent ? (
              <Button
                onClick={() => handleAI("generate")}
                disabled={!hasTitle || isGenerating || isImproving}
                variant="outline"
                size="sm"
                className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white disabled:opacity-50 w-full"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Content with AI
              </Button>
            ) : (
              <div className="grid grid-cols-3 w-full gap-2">
                {[
                  { type: "enhance", icon: Sparkles, color: "green" },
                  { type: "expand", icon: Plus, color: "blue" },
                  { type: "simplify", icon: Minus, color: "orange" },
                ].map(({ type, icon: Icon, color }) => (
                  <Button
                    key={type}
                    onClick={() => handleAI("improve", type)}
                    disabled={isGenerating || isImproving}
                    variant="outline"
                    size="sm"
                    className={`border-${color}-500 text-${color}-400 hover:bg-${color}-500 hover:text-white disabled:opacity-50`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    AI {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            )}
            {!hasTitle && (
              <p className="text-xs text-slate-400 w-full pt-2">
                Add a title to enable AI content generation
              </p>
            )}
          </div>

          {(isGenerating || isImproving) && (
            <BarLoader width={"95%"} color="#D8B4FE" />
          )}

          {/* Editor */}
          <div className="prose prose-lg max-w-none">
            <ReactQuill
              ref={setQuillRef}
              theme="snow"
              value={watchedValues.content}
              onChange={(content) => setValue("content", content)}
              modules={getQuillModules()}
              formats={quillConfig.formats}
              placeholder="Tell your story... or use AI to generate content!"
              style={{
                minHeight: "400px",
                fontSize: "1.125rem",
                lineHeight: "1.7",
              }}
            />
            {errors.content && (
              <p className="text-red-400 mt-2">{errors.content.message}</p>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .ql-editor {
          color: white !important;
          font-size: 1.125rem !important;
          line-height: 1.7 !important;
          padding: 0 !important;
          min-height: 400px !important;
        }
        .ql-editor::before {
          color: rgb(100, 116, 139) !important;
        }
        .ql-toolbar {
          border: none !important;
          padding: 0 0 1rem 0 !important;
          position: sticky !important;
          top: 80px !important;
          background: rgb(15, 23, 42) !important;
          z-index: 30 !important;
          border-radius: 8px !important;
          margin-bottom: 1rem !important;
        }
        .ql-container {
          border: none !important;
        }
        .ql-snow .ql-tooltip {
          background: rgb(30, 41, 59) !important;
          border: 1px solid rgb(71, 85, 105) !important;
          color: white !important;
        }
        .ql-snow .ql-picker {
          color: white !important;
        }
        .ql-snow .ql-picker-options {
          background: rgb(30, 41, 59) !important;
          border: 1px solid rgb(71, 85, 105) !important;
        }
        .ql-snow .ql-fill,
        .ql-snow .ql-stroke.ql-fill {
          fill: white !important;
        }
        .ql-snow .ql-stroke {
          stroke: white !important;
        }
        .ql-editor h2 {
          font-size: 2rem !important;
          font-weight: 600 !important;
          color: white !important;
        }
        .ql-editor h3 {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          color: white !important;
        }
        .ql-editor blockquote {
          border-left: 4px solid rgb(147, 51, 234) !important;
          color: rgb(203, 213, 225) !important;
          padding-left: 1rem !important;
          font-style: italic !important;
        }
        .ql-editor a {
          color: rgb(147, 51, 234) !important;
        }
        .ql-editor code {
          background: rgb(51, 65, 85) !important;
          color: rgb(248, 113, 113) !important;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
        }
      `}</style>
    </>
  );
}
   










// 1. Why did you use "use client" at the top of this file?

// Answer:
// In Next.js 13+, components are server components by default.
// This editor component needs browser-only APIs because:

// ReactQuill accesses window and DOM directly

// Image uploading and Quill events only work on the client

// React Hook Form’s controlled components behave differently on the server

// By marking it as "use client", I ensure the entire component renders on the client, which prevents SSR errors like window is not defined.

// ✅ 2. Why are you using dynamic import for ReactQuill?

// Answer:
// Quill is not SSR compatible—it expects the DOM to exist.
// If I import it normally in Next.js, it throws errors during server rendering.

// So I use:

// dynamic(() => import("react-quill-new"), { ssr: false });


// This ensures:

// ReactQuill loads only in the browser

// Server-side rendering is bypassed

// Bundle size is optimized (lazy loaded only when needed)

// ✅ 3. Why did you use useState for isGenerating and isImproving?

// Answer:
// These states represent UI interaction states, not form data.

// They control:

// Button disabled state

// BarLoader animation

// Preventing duplicate API calls

// This improves UX and ensures no accidental double-generation occurs.

// ✅ 4. What does watch() from React Hook Form do here?

// Answer:
// watch() gives me real-time values of form fields without re-rendering the entire component.

// I use it to:

// Enable/disable AI buttons

// Check if content exists

// Show live previews (featured image, title)

// It’s more performant than storing all form fields in useState.

// ✅ 5. Why use setValue() instead of state for the content editor?

// Answer:
// Because React Hook Form manages input values more efficiently.

// Quill is not a normal input field; it’s a rich editor.
// So I manually update the form value:

// setValue("content", content);


// Advantages:

// RHF manages validation

// No unnecessary rerenders

// Content remains part of form submission

// ✅ 6. Why can’t this editor run on the server?

// Answer:
// Two main reasons:

// Quill requires the DOM (window, document, selection APIs)

// AI actions and image uploading interact with browser APIs

// Client interactions like toolbar clicks need CSR

// So SSR must be disabled.

// ✅ 7. How would you optimize the editor’s performance?

// Answer:

// Lazy-load the editor (already done with dynamic import).

// Memoize toolbar configuration with useMemo.

// Debounce onChange when user types.

// Split the editor into separate subcomponents.

// Load Quill CSS only on the client.

// These optimizations reduce rerenders and improve first-load time.

// ✅ 8. What advantages does React Hook Form give over useState?

// Answer:

// Performance – RHF uses uncontrolled components; fewer rerenders.

// Validation – integrates with Zod/Yup easily.

// Better scalability – forms with many fields behave efficiently.

// Cleaner code – no need to manage state for every input manually.

// ✅ 9. Why did you register the title input but manually set value for content?

// Answer:
// Because:

// The title input is a normal HTML input → easy for RHF to manage.

// Quill is a complex controlled component → RHF cannot directly register it.

// So for Quill I manually sync content using setValue.

// This is the recommended approach from RHF for 3rd-party editors.

// ✅ 10. How does the custom image upload handler work?

// Answer:
// I override Quill’s default image handler:

// handlers: { image: () => onImageUpload("content") }


// When user clicks the image button:

// Instead of default Quill file picker

// My custom upload logic opens (Cloudinary/ImageKit/etc.)

// The uploaded URL is inserted into the editor

// This gives full control over storage, resizing, and security.

// ✅ 11. What are modules and formats in Quill?

// Answer:
// modules:
// Defines toolbar, keyboard shortcuts, custom handlers.

// formats:
// Whitelisted formatting types that Quill is allowed to output (bold, header, image, etc.).

// If a format isn’t listed, Quill strips it—this prevents invalid HTML.

// ✅ 12. Why use setQuillRef?

// Answer:
// I pass Quill’s editor instance back to the parent so it can:

// Insert text programmatically

// Trigger AI functions with cursor position

// Apply formatting

// Scroll or focus the editor

// This gives flexibility for future features.

// ✅ 13. How does the AI content generation workflow work?

// Answer:

// Validate title and confirm overwriting if needed

// Set loading state

// Call server action generateBlogContent()

// Retrieve AI output

// Update form with setValue("content")

// Show toast to user

// Stop loader

// It's a clean async lifecycle with proper UI feedback.

// ✅ 14. Difference between Generate vs Improve content?
// Generate:

// Creates fresh content from scratch

// Requires only the title (and optional category/tags)

// Replaces existing content

// Improve:

// Requires existing content

// Enhances, expands, or simplifies the text

// Keeps original content structure

// This design gives users both creation and editing capabilities.

// ✅ 15. How do you prevent accidental overwrite of existing content?

// Answer:
// I check if content exists, then use a confirmation dialog:

// if (content && !window.confirm(...)) return;


// This prevents users from losing work unintentionally.

// ✅ 16. Why different AI buttons depending on content?

// Answer:
// UX-driven approach:

// When content is empty → user probably wants generation

// When content exists → user wants improvement

// Makes the UI more intuitive and avoids clutter.

// ✅ 17. Why disable buttons during AI actions?

// Answer:
// To prevent:

// Duplicate API calls

// Content corruption

// UI bugs

// Also improves user experience by signaling "action is in progress."

// ✅ 18. Why use global CSS for Quill customization?

// Answer:
// Quill renders its own DOM outside of your React/scoped CSS.
// To override these styles, you must target them at global scope.

// Next.js <style jsx global> is the easiest way.

// ✅ 19. How is validation handled?

// Answer:

// Three layers:

// React Hook Form → required, minLength, Zod validation

// Manual checks → ensure title before AI generate, content before improve

// Toast messages for user feedback

// This avoids invalid AI calls and protects user data.

// ✅ 20. If you had to refactor this file, how would you improve it?

// Perfect interview answer:

// “I would refactor the component by breaking it into small reusable units and extracting the logic out of the UI for better maintainability.”

// Improvements:
// 🟦 1. Extract AI logic into a custom hook

// useAIContent({ setValue, watch })

// 🟩 2. Split UI components

// <FeaturedImage />

// <AITools />

// <RichTextEditor />

// 🟧 3. Memoize Quill modules with useMemo
// 🟨 4. Move styles into a CSS file for better readability
// 🟪 5. Add debounced onChange to reduce performance load

// This shows a deep understanding of architecture and scalability.