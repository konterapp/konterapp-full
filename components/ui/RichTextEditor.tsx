'use client';

import React, { useEffect, useRef } from 'react';
import type Quill from 'quill';

interface RichTextEditorProps {
    id?: string;
    name?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    hasError?: boolean;
    minHeight?: string;
}

export default function RichTextEditor({
    id,
    name,
    value,
    onChange,
    placeholder = 'Tulis sesuatu...',
    hasError = false,
    minHeight = '200px',
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);
    const isInternalChange = useRef(false);
    const isInitialized = useRef(false);

    // Initialize Quill (client-side only)
    useEffect(() => {
        if (typeof window === 'undefined' || isInitialized.current) return;

        const initQuill = async () => {
            if (!editorRef.current) return;

            // Load Quill CSS v2 — inject dari node_modules (match versi package)
            if (!document.querySelector('link[data-quill-css]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css';
                link.setAttribute('data-quill-css', '1');
                document.head.appendChild(link);
            }

            // Dynamic import Quill only on client side
            const QuillModule = (await import('quill')).default;

            // Re-check after async import — component may have unmounted
            if (!editorRef.current || quillRef.current) return;

            quillRef.current = new QuillModule(editorRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ color: [] }, { background: [] }],
                        ['link'],
                        ['clean'],
                    ],
                },
                placeholder: placeholder,
            });

            // Set initial value
            if (value) {
                quillRef.current.root.innerHTML = value;
            }

            // Handle text change
            quillRef.current.on('text-change', () => {
                if (quillRef.current) {
                    isInternalChange.current = true;
                    const html = quillRef.current.root.innerHTML;
                    // Return empty string if editor only has empty paragraph
                    const isEmpty = html === '<p><br></p>' || html === '';
                    onChange(isEmpty ? '' : html);
                }
            });

            isInitialized.current = true;
        };

        initQuill();

        return () => {
            quillRef.current = null;
            isInitialized.current = false;
        };
         
    }, []);

    // Sync external value changes
    useEffect(() => {
        if (quillRef.current && !isInternalChange.current) {
            const currentContent = quillRef.current.root.innerHTML;
            if (currentContent !== value && value !== undefined) {
                quillRef.current.root.innerHTML = value || '';
            }
        }
        isInternalChange.current = false;
    }, [value]);

    // Update error state class
    useEffect(() => {
        if (editorRef.current) {
            if (hasError) {
                editorRef.current.classList.add('has-error');
            } else {
                editorRef.current.classList.remove('has-error');
            }
        }
    }, [hasError]);

    return (
        <div className="rich-text-editor-wrapper">
            {/* Hidden input for form submission */}
            <input type="hidden" id={id} name={name} value={value} />

            <div
                ref={editorRef}
                className="rich-text-editor"
                style={{ minHeight }}
            />

            <style jsx global>{`
        .rich-text-editor-wrapper {
          position: relative;
        }

        .rich-text-editor-wrapper .ql-toolbar {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem 0.5rem 0 0;
          padding: 8px;
        }

        .rich-text-editor-wrapper .ql-container {
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 0.5rem 0.5rem;
          font-size: 0.875rem;
          background: white;
        }

        .rich-text-editor-wrapper .ql-editor {
          min-height: 150px;
          padding: 12px;
        }

        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }

        /* Focus state */
        .rich-text-editor-wrapper .ql-container.ql-snow:focus-within {
          border-color: #EBC170;
          box-shadow: 0 0 0 2px rgba(235, 193, 112, 0.2);
        }

        /* Error state */
        .rich-text-editor-wrapper:has(.has-error) .ql-toolbar {
          border-color: #ef4444 !important;
        }

        .rich-text-editor-wrapper:has(.has-error) .ql-container {
          border-color: #ef4444 !important;
        }

        .rich-text-editor-wrapper:has(.has-error) .ql-container.ql-snow:focus-within {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }

        /* Customize toolbar buttons */
        .rich-text-editor-wrapper .ql-toolbar button:hover,
        .rich-text-editor-wrapper .ql-toolbar button:focus,
        .rich-text-editor-wrapper .ql-toolbar .ql-picker-label:hover,
        .rich-text-editor-wrapper .ql-toolbar .ql-active {
          color: #EBC170;
        }

        .rich-text-editor-wrapper .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor-wrapper .ql-toolbar button:focus .ql-stroke,
        .rich-text-editor-wrapper .ql-toolbar .ql-active .ql-stroke {
          stroke: #EBC170;
        }

        .rich-text-editor-wrapper .ql-toolbar button:hover .ql-fill,
        .rich-text-editor-wrapper .ql-toolbar button:focus .ql-fill,
        .rich-text-editor-wrapper .ql-toolbar .ql-active .ql-fill {
          fill: #EBC170;
        }
      `}</style>
        </div>
    );
}
