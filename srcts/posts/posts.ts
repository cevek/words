type PartData = {id: string; partId: string; origin: string; translate: string}[];
type RawData = [string, string, string][];

export interface Part {
    id: string;
    title: string;
    data: PartData;
    rawData: RawData;
}
const nextId = 352;
export const posts:{id: string; title: string; parts: Part[]}[] = [
    {
        "id": "alissa",
        "title": "Alissa",
        "parts": [
            {"id": "alissa-1", "title": "Part1", "data": null, "rawData": require<RawData>("json!./alissa/1.json")},
            {"id": "alissa-2", "title": "Part2", "data": null, "rawData": require<RawData>("json!./alissa/2.json")},
            {"id": "alissa-3", "title": "Part3", "data": null, "rawData": require<RawData>("json!./alissa/3.json")},
            {"id": "alissa-4", "title": "Part4", "data": null, "rawData": require<RawData>("json!./alissa/4.json")},
            {"id": "alissa-5", "title": "Part5", "data": null, "rawData": require<RawData>("json!./alissa/5.json")},
        ],
    },
    {
        "id": "sara",
        "title": "Sara",
        "parts": [
            {"id": "sara-1", "title": "Part1", "data": null, "rawData": require<RawData>("json!./sara/1.json")},
            {"id": "sara-2", "title": "Part2", "data": null, "rawData": require<RawData>("json!./sara/2.json")},
            {"id": "sara-3", "title": "Part3", "data": null, "rawData": require<RawData>("json!./sara/3.json")},
            {"id": "sara-4", "title": "Part4", "data": null, "rawData": require<RawData>("json!./sara/4.json")},
            {"id": "sara-5", "title": "Part5", "data": null, "rawData": require<RawData>("json!./sara/5.json")},
            {"id": "sara-6", "title": "Part6", "data": null, "rawData": require<RawData>("json!./sara/6.json")},
            {"id": "sara-7", "title": "Part7", "data": null, "rawData": require<RawData>("json!./sara/7.json")},
        ]
    },
    {
        "id": "animal",
        "title": "Animal Life Cycles",
        "parts": [
            {"id": "animal-1", "title": "Part1", "data": null, "rawData": require<RawData>("json!./animal/1.json")},
            {"id": "animal-2", "title": "Part2", "data": null, "rawData": require<RawData>("json!./animal/2.json")},
            {"id": "animal-3", "title": "Part3", "data": null, "rawData": require<RawData>("json!./animal/3.json")},
            //{"id": "animal-4", "title": "Part4", "rawData": require("json!./sara/4.json")},
            //{"id": "animal-5", "title": "Part5", "rawData": require("json!./sara/5.json")},
            //{"id": "animal-6", "title": "Part6", "rawData": require("json!./sara/6.json")},
            //{"id": "animal-7", "title": "Part7", "rawData": require("json!./sara/7.json")},
        ]
    },
];

//var id = 1; posts.forEach(item => item.parts.forEach(part => part.data.forEach(line => line.unshift(id++))));
posts.forEach(item => item.parts.forEach(part => {
    part.data = part.rawData.map(rawData => ({
        id: rawData[0],
        partId: part.id,
        origin: rawData[1],
        translate: rawData[2],
    }))
}));
//console.log(posts);

export function findPartById(id:string):Part {
    for (var post of posts) {
        for (var part of post.parts) {
            if (part.id == id) {
                return part;
            }
        }
    }
}
