import { useState } from "react";
import { Send, MessageCircle, ThumbsUp, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const testimonials = [
  {
    id: 1,
    name: "Alex M.",
    handle: "@alexmemes",
    content: "MemeVerse is literally the first thing I check every morning. The content is always on point!",
    avatar: "A",
  },
  {
    id: 2,
    name: "Sarah K.",
    handle: "@sarahk_online",
    content: "Finally, an Instagram page that actually makes me laugh. Following was the best decision ever.",
    avatar: "S",
  },
  {
    id: 3,
    name: "Mike R.",
    handle: "@mikey_dev",
    content: "The tech memes here hit different. As a developer, I feel seen.",
    avatar: "M",
  },
];

export function CommunitySection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    memeIdea: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing information",
        description: "Please fill in your name and email.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: "Meme idea submission",
          memeIdea: formData.memeIdea,
        }),
      });

      if (response.ok) {
        toast({
          title: "Submitted!",
          description: "Thanks for your meme idea! We'll check it out.",
        });
        setFormData({ name: "", email: "", memeIdea: "" });
      } else {
        throw new Error("Failed to submit");
      }
    } catch {
      toast({
        title: "Submission failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="community" className="py-20 md:py-28 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-bold text-3xl md:text-5xl mb-4">
            Join the <span className="text-primary">Community</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto font-serif">
            Be part of our growing family. Share your meme ideas, connect with 
            fellow meme lovers, and help us create the content you love.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              What Our Followers Say
            </h3>
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} data-testid={`card-testimonial-${testimonial.id}`}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium">{testimonial.name}</span>
                        <span className="text-sm text-muted-foreground">{testimonial.handle}</span>
                      </div>
                      <p className="text-muted-foreground text-sm md:text-base">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-muted-foreground text-sm">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          Like
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          Favorite
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Submit a Meme Idea
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Your Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Describe your meme idea... What's funny? What's the context?"
                      rows={4}
                      value={formData.memeIdea}
                      onChange={(e) => setFormData({ ...formData, memeIdea: e.target.value })}
                      className="resize-none"
                      data-testid="textarea-meme-idea"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isSubmitting}
                    data-testid="button-submit-idea"
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Idea
                      </>
                    )}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  We read every submission! If we use your idea, we'll give you a shoutout.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
