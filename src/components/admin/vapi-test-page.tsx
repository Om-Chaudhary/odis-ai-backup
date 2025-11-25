"use client";

import { useState, useEffect, useRef } from "react";
import Vapi from "@vapi-ai/web";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Phone, PhoneOff, Loader2, Code } from "lucide-react";
import { toast } from "sonner";
import type { DynamicVariables } from "~/lib/vapi/types";
import { createTestScenario } from "~/lib/vapi/knowledge-base";

type TestScenario =
  | "discharge-wellness"
  | "discharge-vaccination"
  | "followup-gi"
  | "followup-surgery"
  | "followup-ear"
  | "followup-orthopedic"
  | "custom";

const TEST_SCENARIOS: Record<
  TestScenario,
  { label: string; data: DynamicVariables }
> = {
  "discharge-wellness": {
    label: "Discharge - Wellness Exam",
    data: {
      clinicName: "Alum Rock Pet Hospital",
      agentName: "Sarah",
      petName: "Bella",
      ownerName: "John Smith",
      appointmentDate: "November eighth",
      callType: "discharge",
      subType: "wellness",
      clinicPhone: "four zero eight, two five nine, eight seven six five",
      emergencyPhone: "four zero eight, eight six five, four three two one",
      dischargeSummary: `had her annual wellness exam today with Doctor Chen. We did a complete physical examination, checked her weight which is perfect at thirty two pounds, examined her teeth and gums, listened to her heart and lungs, and felt her abdomen. Everything looked fantastic. Her vaccines are all up to date and we collected a fecal sample which came back negative for parasites. Her bloodwork panel showed all normal values for kidney and liver function`,
      nextSteps: `We recommend continuing her current diet and exercise routine. Bella's next annual wellness exam will be due around this time next year. Keep an eye on her dental health and consider scheduling a dental cleaning in about six months if you notice any tartar buildup. Continue her monthly heartworm and flea prevention year round`,
    },
  },
  "discharge-vaccination": {
    label: "Discharge - Vaccination",
    data: {
      clinicName: "Alum Rock Pet Hospital",
      agentName: "Emma",
      petName: "Max",
      ownerName: "Sarah Johnson",
      appointmentDate: "November tenth",
      callType: "discharge",
      subType: "vaccination",
      clinicPhone: "four zero eight, two five nine, eight seven six five",
      emergencyPhone: "four zero eight, eight six five, four three two one",
      dischargeSummary: `came in today for his puppy vaccination series. Doctor Martinez administered the D A two P P vaccine which protects against distemper, adenovirus, parvovirus, and parainfluenza. We also started his bordetella vaccine for kennel cough since you mentioned he might go to doggy daycare soon. Max weighed in at eighteen pounds which is great for a four month old golden retriever. His physical exam was completely normal and he was very well behaved for his vaccines`,
      nextSteps: `Max will need his next D A two P P booster in three to four weeks. We'll also do his rabies vaccine at that visit since he'll be sixteen weeks old by then. Please continue socializing him with other vaccinated puppies and keep up with his puppy training classes. We recommend starting him on monthly heartworm prevention now that he's old enough. Our team will call you in about three weeks to schedule that next appointment`,
    },
  },
  "followup-gi": {
    label: "Follow-Up - GI Issue (Vomiting/Diarrhea)",
    data: createTestScenario({
      clinicName: "Alum Rock Pet Hospital",
      agentName: "Sarah",
      petName: "Luna",
      ownerName: "Mike Chen",
      appointmentDate: "November fifth",
      callType: "follow-up",
      condition: "acute gastroenteritis with vomiting and diarrhea",
      conditionCategory: "gastrointestinal",
      clinicPhone: "four zero eight, two five nine, eight seven six five",
      emergencyPhone: "four zero eight, eight six five, four three two one",
      dischargeSummary: `came in four days ago presenting with acute vomiting and watery diarrhea that started the night before. Doctor Patel examined her and found she was mildly dehydrated but still alert and responsive. We ran a fecal test which was negative for parasites and parvovirus. Luna received subcutaneous fluids for hydration and was sent home with metronidazole and a probiotic. We also recommended a bland diet of boiled chicken and rice for a few days`,
      medications: `metronidazole two hundred fifty milligrams twice daily with food, and fortiflora probiotic powder sprinkled on food once daily`,
      nextSteps: `Please continue the metronidazole for the full seven day course even if Luna seems better. Keep her on the bland diet for at least three more days, then gradually transition back to her regular food over four to five days by mixing increasing amounts of regular food with the bland diet. Make sure she has access to fresh water at all times. Watch for any return of vomiting or diarrhea`,
      recheckDate: "November twentieth if symptoms return",
      petSpecies: "dog",
      daysSinceTreatment: 4,
    }),
  },
  "followup-surgery": {
    label: "Follow-Up - Post-Surgery",
    data: createTestScenario({
      clinicName: "Alum Rock Pet Hospital",
      agentName: "Emma",
      petName: "Rocky",
      ownerName: "Jennifer Martinez",
      appointmentDate: "November seventh",
      callType: "follow-up",
      condition: "ovariohysterectomy, also known as a spay surgery",
      conditionCategory: "post-surgical",
      clinicPhone: "four zero eight, two five nine, eight seven six five",
      emergencyPhone: "four zero eight, eight six five, four three two one",
      dischargeSummary:
        "had her spay surgery three days ago on November seventh. The procedure went very smoothly with no complications. Doctor Rodriguez performed the surgery and Rocky recovered well from anesthesia. She went home the same day with pain medication and an Elizabethan collar. Her incision is a small abdominal incision with internal dissolvable sutures and external skin glue, so there are no stitches to remove",
      medications:
        "carprofen fifty milligrams twice daily with food for pain and inflammation. She has enough for five days total",
      nextSteps:
        "The most important thing is to keep Rocky quiet and restrict her activity for the next ten to fourteen days. No running, jumping, or rough play. Short leash walks for bathroom breaks only. She must wear the E collar at all times to prevent licking the incision. The incision should be kept clean and dry, no baths for at least fourteen days. Monitor the incision daily for any redness, swelling, discharge, or if it opens up. Some minor swelling and bruising is normal",
      recheckDate:
        "November twenty first for a recheck examination to make sure the incision is healing properly",
      petSpecies: "dog",
      daysSinceTreatment: 3,
    }),
  },
  "followup-ear": {
    label: "Follow-Up - Ear Infection",
    data: {
      clinicName: "Alum Rock Pet Hospital",
      agentName: "Sarah",
      petName: "Cooper",
      ownerName: "David Lee",
      appointmentDate: "November sixth",
      callType: "follow-up",
      condition:
        "bilateral bacterial otitis externa, which means an ear infection in both ears",
      clinicPhone: "four zero eight, two five nine, eight seven six five",
      emergencyPhone: "four zero eight, eight six five, four three two one",
      dischargeSummary: `came in five days ago because you noticed he was shaking his head and scratching at his ears frequently. Doctor Kim examined both ears and found they were red, inflamed, and had a brown discharge with a yeasty odor. We took samples from both ears and found a combination of bacteria and yeast under the microscope. Cooper's ear canals were quite painful, so Doctor Kim cleaned them gently and prescribed a combination antibiotic and antifungal ear medication`,
      medications: `Mometamax ointment, apply five to eight drops in each ear twice daily. Make sure to massage the base of the ear after applying to help distribute the medication down the ear canal`,
      nextSteps: `Continue the ear medication for the full fourteen day course even if his ears look better before then. You can clean any discharge from the outer ear with a damp cloth, but do not use cotton swabs or put anything down into the ear canal. Cooper may continue to shake his head for the first few days as the medication works. If he seems very uncomfortable or the ears get worse, please call us. After finishing the medication, keep his ears dry when bathing and consider regular ear cleaning as preventive care`,
      recheckDate:
        "November twenty second so we can reexamine his ears and make sure the infection has completely cleared",
    },
  },
  "followup-orthopedic": {
    label: "Follow-Up - Limping/Arthritis",
    data: {
      clinicName: "Alum Rock Pet Hospital",
      agentName: "Emma",
      petName: "Duke",
      ownerName: "Amanda Wilson",
      appointmentDate: "November fourth",
      callType: "follow-up",
      condition:
        "osteoarthritis in the right hip joint causing intermittent lameness",
      clinicPhone: "four zero eight, two five nine, eight seven six five",
      emergencyPhone: "four zero eight, eight six five, four three two one",
      dischargeSummary: `came in last week because you noticed he was limping on his right hind leg, especially after lying down for a while. Doctor Thompson performed a thorough orthopedic examination and took X rays of both hips. The X rays showed moderate degenerative joint disease in the right hip, which is arthritis. This is fairly common in larger breed dogs like Duke, especially at age eight. The good news is that this is manageable with medication and lifestyle modifications`,
      medications: `Rimadyl, which is carprofen, seventy five milligrams once daily with food. This is an anti inflammatory that will help with pain and stiffness. We also started him on Dasuquin joint supplement chewable tablets, give one tablet daily. This contains glucosamine and chondroitin to help support joint health`,
      nextSteps: `Managing arthritis is a long term process. Keep Duke at a healthy weight as extra pounds put more stress on the joints. Continue with gentle, regular exercise like short leash walks twice daily rather than one long walk. Swimming is excellent if he enjoys it. Avoid high impact activities like jumping or running on hard surfaces. Consider getting him an orthopedic dog bed for better support. Watch for any signs of stomach upset from the Rimadyl like vomiting or diarrhea. We may need to adjust his pain medication over time`,
      recheckDate: `November eighteenth to see how he's responding to the medication and assess if we need to make any changes to his treatment plan`,
    },
  },
  custom: {
    label: "Custom (Manual Entry)",
    data: {
      clinicName: "Alum Rock Pet Hospital",
      agentName: "Sarah",
      petName: "",
      ownerName: "",
      appointmentDate: "",
      callType: "discharge",
      clinicPhone: "four zero eight, two five nine, eight seven six five",
      emergencyPhone: "four zero eight, eight six five, four three two one",
      dischargeSummary: "",
    },
  },
};

export function VapiTestPage() {
  const vapiRef = useRef<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<
    Array<{ role: string; text: string }>
  >([]);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedScenario, setSelectedScenario] =
    useState<TestScenario>("discharge-wellness");
  const [variables, setVariables] = useState<DynamicVariables>(
    TEST_SCENARIOS["discharge-wellness"].data,
  );

  // Initialize Vapi client
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!publicKey) {
      toast.error("Vapi public key not configured");
      return;
    }

    try {
      vapiRef.current = new Vapi(publicKey);

      // Set up event listeners
      vapiRef.current.on("call-start", () => {
        console.log("Call started");
        setIsConnected(true);
        setIsConnecting(false);
        setTranscript([]);
        toast.success("Call connected");
      });

      vapiRef.current.on("call-end", () => {
        console.log("Call ended");
        setIsConnected(false);
        setIsConnecting(false);
        toast.info("Call ended");
      });

      vapiRef.current.on("speech-start", () => {
        console.log("Speech started");
      });

      vapiRef.current.on("speech-end", () => {
        console.log("Speech ended");
      });

      vapiRef.current.on("message", (message: unknown) => {
        console.log("Vapi message received:", message);

        if (
          typeof message === "object" &&
          message !== null &&
          "type" in message
        ) {
          const msg = message as Record<string, unknown>;

          // Log different message types for debugging
          if (msg.type === "conversation-update") {
            console.log("Conversation update:", msg);
          } else if (msg.type === "transcript") {
            console.log("Transcript message:", msg);
            setTranscript((prev) => [
              ...prev,
              {
                role: (msg.role as string) ?? "user",
                text:
                  (msg.transcript as string) ??
                  (msg.transcriptType as string) ??
                  "",
              },
            ]);
          } else if (msg.type === "function-call") {
            console.log("Function call:", msg);
          }
        }
      });

      vapiRef.current.on("error", (error: unknown) => {
        console.error("Vapi error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Call error: ${errorMessage}`);
        setIsConnected(false);
        setIsConnecting(false);
      });
    } catch (error) {
      console.error("Failed to initialize Vapi:", error);
      toast.error("Failed to initialize Vapi client");
    }

    return () => {
      if (vapiRef.current) {
        void vapiRef.current.stop();
      }
    };
  }, []);

  const handleStartCall = async () => {
    if (!vapiRef.current) {
      toast.error("Vapi client not initialized");
      return;
    }

    setIsConnecting(true);

    try {
      // Log the variables being sent for debugging
      console.log("Starting Vapi call with variables:", variables);

      // Request microphone permissions first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Microphone permission granted");
      } catch (permError) {
        console.error("Microphone permission denied:", permError);
        toast.error(
          "Microphone access is required for voice calls. Please allow microphone access and try again.",
        );
        setIsConnecting(false);
        return;
      }

      // Start the call with proper assistantOverrides structure
      await vapiRef.current.start(
        "0309c629-a3f2-43aa-b479-e2e783e564a7", // OdisAI Follow-Up Assistant
        {
          variableValues: variables,
        },
      );

      console.log("Vapi call started successfully");
    } catch (error) {
      console.error("Failed to start call:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to start call: ${errorMessage}`);
      setIsConnecting(false);
    }
  };

  const handleEndCall = () => {
    if (vapiRef.current) {
      void vapiRef.current.stop();
    }
  };

  const handleVariableChange = (key: keyof DynamicVariables, value: string) => {
    setVariables((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleScenarioChange = (scenario: TestScenario) => {
    setSelectedScenario(scenario);
    setVariables(TEST_SCENARIOS[scenario].data);
  };

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Vapi Assistant Test Page
        </h1>
        <p className="mt-2 text-slate-600">
          Test the OdisAI Follow-Up Assistant with custom dynamic variables
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Variables Form */}
        <Card className="border-slate-200 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">Dynamic Variables</CardTitle>
            <CardDescription className="text-slate-600">
              Configure the variables that will be passed to the assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test Scenario Selector */}
            <div className="space-y-2">
              <Label htmlFor="scenario" className="font-medium text-slate-700">
                Test Scenario
              </Label>
              <Select
                value={selectedScenario}
                onValueChange={(value) =>
                  handleScenarioChange(value as TestScenario)
                }
                disabled={isConnected || isConnecting}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Select a test scenario" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(TEST_SCENARIOS) as [
                      TestScenario,
                      (typeof TEST_SCENARIOS)[TestScenario],
                    ][]
                  ).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Select a preset scenario or choose &quot;Custom&quot; to
                manually configure all fields
              </p>
            </div>

            <Separator className="my-4" />

            {/* Section 1: Basic Information (Always Visible) */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">
                Basic Information
              </h3>

              <div className="space-y-2">
                <Label
                  htmlFor="clinicName"
                  className="font-medium text-slate-700"
                >
                  Clinic Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clinicName"
                  value={variables.clinicName}
                  onChange={(e) =>
                    handleVariableChange("clinicName", e.target.value)
                  }
                  placeholder="e.g., Alum Rock Pet Hospital"
                  disabled={isConnected || isConnecting}
                  className="border-slate-300 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="agentName"
                  className="font-medium text-slate-700"
                >
                  Agent Name (Vet Tech) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="agentName"
                  value={variables.agentName}
                  onChange={(e) =>
                    handleVariableChange("agentName", e.target.value)
                  }
                  placeholder="e.g., Sarah or Emma"
                  disabled={isConnected || isConnecting}
                  className="border-slate-300 placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500">
                  First name only (e.g., &quot;Sarah&quot;, not &quot;Dr.
                  Sarah&quot;)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="petName" className="font-medium text-slate-700">
                  Pet Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="petName"
                  value={variables.petName}
                  onChange={(e) =>
                    handleVariableChange("petName", e.target.value)
                  }
                  placeholder="e.g., Bella"
                  disabled={isConnected || isConnecting}
                  className="border-slate-300 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ownerName"
                  className="font-medium text-slate-700"
                >
                  Owner Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ownerName"
                  value={variables.ownerName}
                  onChange={(e) =>
                    handleVariableChange("ownerName", e.target.value)
                  }
                  placeholder="e.g., John Smith"
                  disabled={isConnected || isConnecting}
                  className="border-slate-300 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="appointmentDate"
                  className="font-medium text-slate-700"
                >
                  Appointment Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="appointmentDate"
                  value={variables.appointmentDate}
                  onChange={(e) =>
                    handleVariableChange("appointmentDate", e.target.value)
                  }
                  placeholder="e.g., November eighth (spelled out)"
                  disabled={isConnected || isConnecting}
                  className="border-slate-300 placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500">
                  Spell out the date for natural speech (e.g., &quot;November
                  eighth&quot;)
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="callType"
                  className="font-medium text-slate-700"
                >
                  Call Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={variables.callType}
                  onValueChange={(value) =>
                    handleVariableChange(
                      "callType",
                      value as "discharge" | "follow-up",
                    )
                  }
                  disabled={isConnected || isConnecting}
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Select call type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discharge">Discharge Call</SelectItem>
                    <SelectItem value="follow-up">Follow-Up Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="clinicPhone"
                  className="font-medium text-slate-700"
                >
                  Clinic Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clinicPhone"
                  value={variables.clinicPhone}
                  onChange={(e) =>
                    handleVariableChange("clinicPhone", e.target.value)
                  }
                  placeholder="e.g., five five five, two three four, five six seven eight"
                  disabled={isConnected || isConnecting}
                  className="border-slate-300 placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500">
                  Spelled out for natural speech
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="emergencyPhone"
                  className="font-medium text-slate-700"
                >
                  Emergency Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="emergencyPhone"
                  value={variables.emergencyPhone}
                  onChange={(e) =>
                    handleVariableChange("emergencyPhone", e.target.value)
                  }
                  placeholder="e.g., five five five, nine one one one, one one one one"
                  disabled={isConnected || isConnecting}
                  className="border-slate-300 placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500">
                  Spelled out for natural speech
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="dischargeSummary"
                  className="font-medium text-slate-700"
                >
                  Discharge Summary <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="dischargeSummary"
                  value={variables.dischargeSummary}
                  onChange={(e) =>
                    handleVariableChange("dischargeSummary", e.target.value)
                  }
                  placeholder="e.g., received a comprehensive wellness exam and all vitals looked great"
                  rows={3}
                  disabled={isConnected || isConnecting}
                  className="border-slate-300 placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-500">
                  Brief summary that completes: &quot;{variables.petName}{" "}
                  [summary]&quot;
                </p>
              </div>
            </div>

            {/* Section 2: Discharge-Specific Fields */}
            {variables.callType === "discharge" && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">
                    Discharge Call Details
                  </h3>

                  <div className="space-y-2">
                    <Label
                      htmlFor="subType"
                      className="font-medium text-slate-700"
                    >
                      Discharge Sub-Type
                    </Label>
                    <Select
                      value={variables.subType ?? ""}
                      onValueChange={(value) =>
                        handleVariableChange(
                          "subType",
                          value as "wellness" | "vaccination",
                        )
                      }
                      disabled={isConnected || isConnecting}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Select sub-type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wellness">Wellness Exam</SelectItem>
                        <SelectItem value="vaccination">Vaccination</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="nextSteps"
                      className="font-medium text-slate-700"
                    >
                      Next Steps
                    </Label>
                    <Textarea
                      id="nextSteps"
                      value={variables.nextSteps ?? ""}
                      onChange={(e) =>
                        handleVariableChange("nextSteps", e.target.value)
                      }
                      placeholder="e.g., Bella's next wellness visit will be due in about a year"
                      rows={2}
                      disabled={isConnected || isConnecting}
                      className="border-slate-300 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Section 3: Follow-Up Specific Fields */}
            {variables.callType === "follow-up" && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">
                    Follow-Up Call Details
                  </h3>

                  <div className="space-y-2">
                    <Label
                      htmlFor="condition"
                      className="font-medium text-slate-700"
                    >
                      Condition/Diagnosis
                    </Label>
                    <Input
                      id="condition"
                      value={variables.condition ?? ""}
                      onChange={(e) =>
                        handleVariableChange("condition", e.target.value)
                      }
                      placeholder="e.g., vomiting and diarrhea, ear infection, spay surgery"
                      disabled={isConnected || isConnecting}
                      className="border-slate-300 placeholder:text-slate-400"
                    />
                    <p className="text-xs text-slate-500">
                      What the pet was treated for
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="medications"
                      className="font-medium text-slate-700"
                    >
                      Medications
                    </Label>
                    <Textarea
                      id="medications"
                      value={variables.medications ?? ""}
                      onChange={(e) =>
                        handleVariableChange("medications", e.target.value)
                      }
                      placeholder="e.g., metronidazole twice daily with food"
                      rows={2}
                      disabled={isConnected || isConnecting}
                      className="border-slate-300 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="nextSteps"
                      className="font-medium text-slate-700"
                    >
                      Next Steps
                    </Label>
                    <Textarea
                      id="nextSteps"
                      value={variables.nextSteps ?? ""}
                      onChange={(e) =>
                        handleVariableChange("nextSteps", e.target.value)
                      }
                      placeholder="e.g., Continue medication for the full seven days"
                      rows={2}
                      disabled={isConnected || isConnecting}
                      className="border-slate-300 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="recheckDate"
                      className="font-medium text-slate-700"
                    >
                      Recheck Date
                    </Label>
                    <Input
                      id="recheckDate"
                      value={variables.recheckDate ?? ""}
                      onChange={(e) =>
                        handleVariableChange("recheckDate", e.target.value)
                      }
                      placeholder="e.g., November twentieth"
                      disabled={isConnected || isConnecting}
                      className="border-slate-300 placeholder:text-slate-400"
                    />
                    <p className="text-xs text-slate-500">
                      Spelled out for natural speech (optional)
                    </p>
                  </div>
                </div>
              </>
            )}

            <Separator className="my-4" />

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleStartCall}
                disabled={isConnected || isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Start Call
                  </>
                )}
              </Button>

              <Button
                onClick={handleEndCall}
                disabled={!isConnected}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <PhoneOff className="mr-2 h-4 w-4" />
                End Call
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Call Status and Transcript */}
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Call Status</CardTitle>
              <CardDescription className="text-slate-600">
                Current call connection status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Status:
                </span>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnecting
                    ? "Connecting..."
                    : isConnected
                      ? "Connected"
                      : "Disconnected"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Live Transcript</CardTitle>
              <CardDescription className="text-slate-600">
                Real-time conversation transcript
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] space-y-3 overflow-y-auto">
                {transcript.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No transcript yet. Start a call to see the conversation.
                  </p>
                ) : (
                  transcript.map((item, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-3 ${
                        item.role === "assistant"
                          ? "ml-4 border border-teal-200 bg-teal-50"
                          : "mr-4 border border-slate-200 bg-slate-100"
                      }`}
                    >
                      <p className="mb-1 text-xs font-semibold text-slate-700 capitalize">
                        {item.role}
                      </p>
                      <p className="text-sm text-slate-900">{item.text}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900">Debug Info</CardTitle>
                  <CardDescription className="text-slate-600">
                    View the payload being sent to Vapi
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center gap-2"
                >
                  <Code className="h-4 w-4" />
                  {showDebug ? "Hide" : "Show"}
                </Button>
              </div>
            </CardHeader>
            {showDebug && (
              <CardContent>
                <div className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-slate-100">
                  <pre className="text-xs">
                    {JSON.stringify(
                      {
                        assistantId: "0309c629-a3f2-43aa-b479-e2e783e564a7",
                        assistantOverrides: {
                          variableValues: variables,
                        },
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  This is the payload structure being sent to the Vapi SDK
                  start() method. Check browser console for actual API calls.
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
