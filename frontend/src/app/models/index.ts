// Base interface for all items
export interface BaseItem {
    id?: number;
    title: string;
    type: string;
    book_title: string;
    user_rating: number
}

export interface BaseRecommendation {
    id: number;
    title: string;
    confidence: number;
    description: string;
    genre: string;
    type: 'movie' | 'book';
}

export interface MovieRecommendation extends BaseRecommendation {
    type: 'movie';
    cast: string[];
}

export interface BookRecommendation extends BaseRecommendation {
    type: 'book';
    author: string;
}

export type Recommendation = MovieRecommendation | BookRecommendation;

export interface Movie extends BaseItem {
    release_year: number;
    type: 'movie';
    cast: string[];
    director: string;
    genres: string[],
    original_language: string;
    poster_path: string;
    release_date: string
}

export interface Book extends BaseItem {
    book_author: string;
    book_title: string;
    image_url_s: string;
    isbn: number;
    id: number;
    year_of_publication: number;
    type: 'book';
    user_rating: number;
}

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