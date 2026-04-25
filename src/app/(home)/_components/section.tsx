import cn from "@/lib/cn";
import { Card } from "./cards";

export function Section({
  title,
  bg,
  cardcenter,
  cardList,
}: {
  title: string;
  bg?: string;
  cardcenter?: string;
  cardList: {
    icon: string;
    title: string;
    content: string;
  }[];
}) {
  return (
    <section className={cn("py-20", bg)}>
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        <div
          className={cn("grid grid-cols-1 md:grid-cols-3 gap-10", cardcenter)}
        >
          {cardList.map((card) => (
            <Card
              key={card.title}
              icon={card.icon}
              title={card.title}
              content={card.content}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
