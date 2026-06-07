CREATE TABLE "affiliate_clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"neighborhood_id" varchar(255),
	"city_id" varchar(255),
	"user_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiences_data" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"city_id" varchar(255) NOT NULL,
	"neighborhood_id" varchar(255),
	"name" varchar(500) NOT NULL,
	"category" varchar(50) NOT NULL,
	"duration" varchar(100) NOT NULL,
	"rating" numeric(3, 1) NOT NULL,
	"review_count" integer NOT NULL,
	"price_from" numeric(10, 2) NOT NULL,
	"image" text NOT NULL,
	"description" text NOT NULL,
	"affiliate_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"neighborhood_id" varchar(255) NOT NULL,
	"city_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotels_data" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"neighborhood_id" varchar(255) NOT NULL,
	"name" varchar(500) NOT NULL,
	"star_rating" integer NOT NULL,
	"rating" numeric(3, 1) NOT NULL,
	"price_range" varchar(100) NOT NULL,
	"image" text NOT NULL,
	"affiliate_url" text,
	"description" text NOT NULL,
	"distance_to_transit" varchar(100) NOT NULL,
	"amenities" jsonb NOT NULL,
	"coordinates" jsonb
);
--> statement-breakpoint
CREATE TABLE "neighborhood_descriptions" (
	"neighborhood_id" varchar(255) PRIMARY KEY NOT NULL,
	"ai_description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"neighborhood_id" varchar(255) NOT NULL,
	"city_id" varchar(255) NOT NULL,
	"rating" integer NOT NULL,
	"tip" varchar(280),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_neighborhoods" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"neighborhood_id" varchar(255) NOT NULL,
	"city_id" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" varchar(280),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_neighborhoods" ADD CONSTRAINT "trip_neighborhoods_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");