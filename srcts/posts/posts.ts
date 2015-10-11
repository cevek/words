type PartData = [string,string][];

export interface Part {
    id: string;
    title: string;
    data: [string,string][];
}
export const posts:{id: string; title: string; parts: Part[]}[] = [
    {
        "id": "alissa",
        "title": "Alissa",
        "parts": [
            {"id": "alissa-1", "title": "Part1", "data": require<PartData>("json!./alissa/1.json")},
            {"id": "alissa-2", "title": "Part2", "data": require<PartData>("json!./alissa/2.json")},
            {"id": "alissa-3", "title": "Part3", "data": require<PartData>("json!./alissa/3.json")},
            {"id": "alissa-4", "title": "Part4", "data": require<PartData>("json!./alissa/4.json")},
            {"id": "alissa-5", "title": "Part5", "data": require<PartData>("json!./alissa/5.json")},
        ],
    },
    {
        "id": "sara",
        "title": "Sara",
        "parts": [
            {"id": "sara-1", "title": "Part1", "data": require<PartData>("json!./sara/1.json")},
            {"id": "sara-2", "title": "Part2", "data": require<PartData>("json!./sara/2.json")},
            {"id": "sara-3", "title": "Part3", "data": require<PartData>("json!./sara/3.json")},
            {"id": "sara-4", "title": "Part4", "data": require<PartData>("json!./sara/4.json")},
            {"id": "sara-5", "title": "Part5", "data": require<PartData>("json!./sara/5.json")},
            {"id": "sara-6", "title": "Part6", "data": require<PartData>("json!./sara/6.json")},
            {"id": "sara-7", "title": "Part7", "data": require<PartData>("json!./sara/7.json")},
        ]
    },
    {
        "id": "animal",
        "title": "Animal Life Cycles",
        "parts": [
            {"id": "animal-1", "title": "Part1", "data": require<PartData>("json!./animal/1.json")},
            {"id": "animal-2", "title": "Part2", "data": require<PartData>("json!./animal/2.json")},
            {"id": "animal-3", "title": "Part3", "data": require<PartData>("json!./animal/3.json")},
            //{"id": "animal-4", "title": "Part4", "data": require<PartData>("json!./sara/4.json")},
            //{"id": "animal-5", "title": "Part5", "data": require<PartData>("json!./sara/5.json")},
            //{"id": "animal-6", "title": "Part6", "data": require<PartData>("json!./sara/6.json")},
            //{"id": "animal-7", "title": "Part7", "data": require<PartData>("json!./sara/7.json")},
        ]
    },
];

export function findPartById(id:string):Part {
    for (var post of posts) {
        for (var part of post.parts) {
            if (part.id == id) {
                return part;
            }
        }
    }
}
