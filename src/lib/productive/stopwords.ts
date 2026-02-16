//src/lib/productive/stopwords.ts
export const STOPWORDS_ES = [
    // artículos
    "el", "la", "los", "las", "un", "una", "unos", "unas",
    // preposiciones
    "a", "ante", "bajo", "con", "contra", "de", "desde", "durante",
    "en", "entre", "hacia", "hasta", "mediante", "para", "por",
    "según", "sin", "sobre", "tras",
    // conjunciones
    "y", "e", "o", "u", "ni", "pero", "sino",
    // pronombres / determinantes comunes
    "lo", "le", "les", "se", "me", "te", "mi", "mis", "su", "sus",
    "nuestro", "nuestra", "nuestros", "nuestras",
    // otros ruidos frecuentes
    "al", "del", "es", "son", "ser", "estar", "fue", "eran",
    // conectores / relativos / interrogativos (sin tildes)
    "que", "como", "cuando", "donde", "quien", "quienes", "cual", "cuales", "cuyo", "cuya", "cuyos", "cuyas",
    "porque", "pues", "ya", "asi", "tambien", "ademas", "incluso",
    "mas", "menos", "muy"
];

export const STOPWORDS_EN = [
    // articles
    "a", "an", "the",
    // prepositions
    "of", "to", "in", "for", "on", "at", "by", "with", "from", "about",
    "as", "into", "like", "through", "after", "over", "between",
    "out", "against", "during", "without", "before", "under", "around",
    // conjunctions
    "and", "or", "but", "nor", "so", "yet",
    // pronouns / determiners
    "i", "you", "he", "she", "it", "we", "they",
    "me", "him", "her", "us", "them",
    "my", "your", "his", "her", "its", "our", "their",
    // common verbs / noise
    "is", "are", "was", "were", "be", "been", "being",
    "do", "does", "did", "have", "has", "had",
    // conectors / relatives / interrogatives
    "what", "which", "who", "whom", "whose", "where", "when", "why", "how", "that",
    "can", "could", "may", "might", "must", "shall", "should", "will", "would",
    "also", "just", "only", "very", "more", "most", "less", "least"

];

export const STOPWORDS = new Set(
    [...STOPWORDS_ES, ...STOPWORDS_EN]
);
