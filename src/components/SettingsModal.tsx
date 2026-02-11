import { useState } from "react";
import {
  Button,
  InputGroup,
  Label,
  Modal,
  TextField,
  type UseOverlayStateReturn,
} from "@heroui/react";

function EyeIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19.439 15.439C20.3636 14.5212 21.0775 13.6091 21.544 12.955C21.848 12.5287 22 12.3155 22 12C22 11.6845 21.848 11.4713 21.544 11.045C20.1779 9.12944 16.6892 5 12 5C11.0922 5 10.2294 5.15476 9.41827 5.41827M6.74742 6.74742C4.73118 8.09925 3.24215 9.9516 2.45604 11.045C2.15201 11.4713 2 11.6845 2 12C2 12.3155 2.15201 12.5287 2.45604 12.955C3.8221 14.8706 7.31078 19 12 19C13.9908 19 15.7651 18.2557 17.2526 17.2526" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M9.85786 10C9.32783 10.5587 9 11.2412 9 12C9 13.6569 10.3431 15 12 15C12.7588 15 13.4413 14.6722 14 14.1421" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M3 3L21 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

interface SettingsModalProps {
  state: UseOverlayStateReturn;
  apiKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
}

export function SettingsModal({
  state,
  apiKey,
  onSave,
  onClear,
}: SettingsModalProps) {
  const [value, setValue] = useState(apiKey);
  const [visible, setVisible] = useState(false);

  const handleSave = () => {
    onSave(value);
    state.close();
  };

  const handleClear = () => {
    setValue("");
    onClear();
    state.close();
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop className="dark">
        <Modal.Container>
          <Modal.Dialog className="dark bg-zinc-900 border border-zinc-800 text-zinc-100 [&_.modal\_\_close-trigger]:text-zinc-400 [&_.modal\_\_close-trigger:hover]:text-zinc-200">
            <Modal.CloseTrigger />
            <Modal.Header className="border-b border-zinc-800">
              <Modal.Heading className="text-zinc-100">Settings</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-4">
                <TextField
                  fullWidth
                  name="api-key"
                >
                  <Label className="text-zinc-300">Google Gemini API Key</Label>
                  <InputGroup className="bg-zinc-800 border-zinc-700 text-zinc-100 [&_input]:text-zinc-100 [&_input::placeholder]:text-zinc-500">
                    <InputGroup.Input
                      placeholder="AIza..."
                      type={visible ? "text" : "password"}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                    <InputGroup.Suffix className="pr-0">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={visible ? "Hide key" : "Show key"}
                        onPress={() => setVisible(!visible)}
                        className="text-zinc-400 hover:text-zinc-200"
                      >
                        {visible ? <EyeOffIcon size={16} className="text-current" /> : <EyeIcon size={16} className="text-current" />}
                      </Button>
                    </InputGroup.Suffix>
                  </InputGroup>
                </TextField>
                <p className="text-xs text-zinc-500">
                  Your API key is stored locally in your browser and never sent
                  anywhere except Google&apos;s API.
                </p>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-t border-zinc-800">
              <div className="flex gap-2 justify-end w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={handleClear}
                  className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 data-[pressed=true]:bg-zinc-800"
                >
                  Clear Key
                </Button>
                <Button
                  size="sm"
                  onPress={handleSave}
                  className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white"
                >
                  Save
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
