// Base interface for all items
export interface BaseItem {
    id?: number;
    title: string;
    description: string;
    genre: string;
    type: string;
}

// Base interface for recommendations
export interface BaseRecommendation {
    id: number;
    title: string;
    confidence: number;
    description: string;
    genre: string;
    type: 'movie' | 'book';
}

export interface Movie extends BaseItem {
    cast: string[];
    release_year: number;
    type: 'movie';
}

export interface Book extends BaseItem {
    author: string;
    publish_year: number;
    type: 'book';
}

export interface MovieRecommendation extends BaseRecommendation {
    cast: string[];
    type: 'movie';
}

export interface BookRecommendation extends BaseRecommendation {
    author: string;
    type: 'book';
}

export type Recommendation = MovieRecommendation | BookRecommendation;

export interface Review {
    itemId: number;
    itemType: 'movie' | 'book';
    rating: number;
    review: string;
}

export interface ApiResponse<T> {
    data: T[];
    total: number;
    page: number;
}

// Type guard functions
export function isMovie(item: Movie | Book): item is Movie {
    return item.type === 'movie';
}

export function isBook(item: Book | Movie): item is Book {
    return item.type === 'book';
}

export function isMovieRecommendation(item: Recommendation): item is MovieRecommendation {
    return item.type === 'movie';
}

export function isBookRecommendation(item: Recommendation): item is BookRecommendation {
    return item.type === 'book';
}