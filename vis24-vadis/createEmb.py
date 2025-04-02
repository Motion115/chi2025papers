import json
import numpy as np
import torch
import msgpack
from tqdm import tqdm
import umap
import matplotlib.pyplot as plt

if __name__ == '__main__':
    doc_embed_src = 'data/embeddings.pt'
    # load document embeddings - using torch.load() instead of np.load()
    doc_embed = torch.load(doc_embed_src)
    # to numpy
    doc_embed = doc_embed.numpy()

    # use scikit-learn to do kmeans clustering
    from sklearn.cluster import KMeans
    kmeans = KMeans(n_clusters=8, random_state=42, n_init="auto").fit(doc_embed)


    # use umap to reduce dimensionality
    reducer = umap.UMAP()
    embedding = reducer.fit_transform(doc_embed)
    plt.scatter(
        embedding[:, 0],
        embedding[:, 1],
        c=kmeans.labels_,
    )
    plt.show()

    # use tsne
    from sklearn.manifold import TSNE
    tsne = TSNE(n_components=2, random_state=42)
    embedding_tsne = tsne.fit_transform(doc_embed)

    plt.scatter(
        embedding_tsne[:, 0],
        embedding_tsne[:, 1],
        c=kmeans.labels_,
    )
    plt.show()

    with open('./data/research_focus_content.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    embedMap = []

    # print(doc_embed.shape)
    # calculate relevance iteratively
    for idx in tqdm(range(doc_embed.shape[0])):
        entry_embed = doc_embed[idx]
        embedMap.append({
            "id": data[idx]['id'],
            "umap": [embedding[:, 0].tolist()[idx], embedding[:, 1].tolist()[idx]],
            "tsne": [float(embedding_tsne[idx, 0]), float(embedding_tsne[idx, 1])],
            "category": int(kmeans.labels_[idx])
        })

    with open('./data/embedMap.msgpack', 'wb') as f:
        msgpack.dump(embedMap, f)