'use client';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import useModal from '@/hooks/useModal';
import Modal from './Modal';
import MDEditor from '@uiw/react-md-editor';
import { usePathname, useSearchParams } from 'next/navigation';
import { ElementRef, useEffect, useRef, useState } from 'react';
import { getUpdatedUrl, searchParamsToObject } from '@/lib/functions';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useAction } from '@/hooks/useAction';
import { createQuestion } from '@/actions/question';
import { toast } from 'sonner';
import { FormErrors } from './form/form-errors';
import { FormInput } from './form/form-input';
import { useTheme } from 'next-themes';

export const NewPostDialog = () => {
  const { theme } = useTheme();
  const formRef = useRef<ElementRef<'form'>>(null);
  const searchParam = useSearchParams();
  const paramsObject = searchParamsToObject(searchParam);
  const path = usePathname();
  const router = useRouter();
  const [value, setValue] = useState<string>('**Hello world!!!**');
  const [editorHeight, setEditorHeight] = useState<number>(200);
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref, onOpen, onClose } = useModal();
  const handleMarkdownChange = (newValue?: string) => {
    if (typeof newValue === 'string') {
      setValue(newValue);
    }
  };
  useEffect(() => {
    if (paramsObject.newPost === 'open') {
      onOpen();

      const timeoutId = setTimeout(() => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setEditorHeight(rect.height);
        }
      }, 0); // Adjust the delay time if needed

      // Cleanup function to clear the timeout
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      onClose();
    }
  }, [onClose, onOpen, paramsObject.newPost]);

  const { execute, fieldErrors, setFieldErrors } = useAction(createQuestion, {
    onSuccess: (data) => {
      toast.success(`Question "${data.title}" created`);
      formRef?.current?.reset();
      if (!fieldErrors?.content && !fieldErrors?.title && !fieldErrors?.tags) {
        setValue('');
        router.push(
          getUpdatedUrl(path + '/', paramsObject, { newPost: 'close' }),
        );
      }
    },
    onError: (error) => {
      toast.error(error);
    },
  });
  const handleOnCloseClick = () => {
    router.push(getUpdatedUrl(path + '/', paramsObject, { newPost: 'close' }));
    if (fieldErrors?.content || fieldErrors?.title || fieldErrors?.tags) {
      setFieldErrors({});
    }
  };
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('title');

    const tags = formData.get('tags');

    execute({
      title: title?.toString() || '',
      content: value,
      tags: (tags?.toString() || '').split(','),
    });
  };

  return (
    <Modal ref={ref} onClose={handleOnCloseClick}>
      <form ref={formRef} onSubmit={onSubmit}>
        <div className="fixed inset-0 flex items-center justify-center z-50  p-4 md:p-8">
          <div
            ref={containerRef}
            className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-3xl md:max-w-4xl pt-8 p-2 space-y-4  w-full h-5/6 "
          >
            <button
              type="button"
              className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
              onClick={handleOnCloseClick}
            >
              x
            </button>
            <FormInput
              id="title"
              placeholder="Enter question title..."
              errors={fieldErrors}
            />
            <div className="flex-grow">
              <div data-color-mode={theme}>
                <div className="wmde-markdown-var"> </div>
                <MDEditor
                  id="content"
                  value={value}
                  onChange={handleMarkdownChange}
                  style={{ height: '100%' }}
                  height={editorHeight - 200}
                  visibleDragbar={false}
                />
                <FormErrors id="content" errors={fieldErrors} />
              </div>
            </div>
            <FormInput
              id="tags"
              placeholder="Enter tags seperated by comma : hello,world"
              errors={fieldErrors}
            />
            <Button type="submit">Post-it</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
