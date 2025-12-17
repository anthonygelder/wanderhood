import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do you calculate walkability scores?",
    answer: "Our walkability scores are based on multiple factors including pedestrian infrastructure, proximity to daily amenities, street connectivity, and terrain. We combine data from various sources and validate with local insights to provide accurate scores."
  },
  {
    question: "What does 'transit connectivity' mean?",
    answer: "Transit connectivity measures how well a neighborhood is served by public transportation. This includes proximity to metro/subway stations, bus routes, frequency of service, and connections to other parts of the city."
  },
  {
    question: "How do you determine safety ratings?",
    answer: "Safety ratings are derived from official crime statistics, local government data, and traveler reviews. We focus on metrics relevant to tourists, such as street crime rates and general neighborhood safety reputation."
  },
  {
    question: "Do I really not need a car in these neighborhoods?",
    answer: "Yes! All neighborhoods we recommend are specifically chosen because they allow you to get around comfortably without a car. Whether you prefer walking or public transit, you'll be able to reach major attractions and daily necessities easily."
  },
  {
    question: "How do hotel affiliate links work?",
    answer: "When you click on a hotel link and make a booking, we may earn a small commission at no extra cost to you. This helps us keep StayMap free and continue providing neighborhood recommendations."
  },
  {
    question: "Can I trust the AI-generated descriptions?",
    answer: "Our AI descriptions are based on real data about each neighborhood and are designed to give you an authentic feel for the area. They're crafted to highlight what makes each neighborhood unique for car-free travelers."
  },
];

export function FAQSection() {
  return (
    <section className="py-16 md:py-24 bg-background" data-testid="faq-section">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground mt-2">
            Everything you need to know about using StayMap
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border border-border rounded-md px-4"
              data-testid={`accordion-faq-${index}`}
            >
              <AccordionTrigger className="text-left font-medium py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
