# 이미지 포맷 변환 실험 (Image Format Experiments)

이 프로젝트는 다양한 이미지 포맷(WebP, JPG, PNG 등)의 압축 효율과 성능을 실험하고, 그 결과를 체계적으로 기록하기 위해 만들어졌습니다.

## 🚀 새로운 실험 추가 방법 (JSON 기반 자동화)

새로운 이미지 변환 실험을 추가하는 과정은 **JSON 설정 파일**을 통해 완전 자동화됩니다.

1.  **실험 설정 파일 생성**:

    - `queue/` 디렉토리에 실험 설정을 담은 `[실험이름].json` 파일을 생성합니다. 파일명은 그대로 실험 이름이 됩니다.
    - 아래 예시와 같이 `source`와 `conversions` 항목을 작성합니다.

    **예시: `queue/ss0607-compression-test.json`**

    ```json
    {
      "source": "sources/ss0607.png",
      "conversions": [
        { "format": "webp", "quality": 85 },
        { "format": "webp", "quality": 60 },
        { "format": "jpeg", "quality": 85 },
        { "format": "jpeg", "quality": 60 }
      ]
    }
    ```

2.  **Commit & Push**:

    - 새로 추가한 `json` 파일과 실험에 사용할 원본 이미지를 `main` 브랜치에 Commit하고 Push합니다. (또는 PR을 통해 Merge합니다)

3.  **자동화 실행 확인**:
    - `main` 브랜치에 변경사항이 반영되면 **GitHub Actions**가 자동으로 나머지 모든 과정을 처리합니다.
    - ✅ `experiments/` 폴더 내에 실험 폴더 생성
    - ✅ 원본 이미지 복사 및 변환 실행
    - ✅ 결과 리포트(`report.md`) 생성
    - ✅ 메인 `README.md`의 실험 목록 업데이트
    - ✅ 처리 완료된 `json` 파일을 결과 폴더로 이동
    - 자동화 봇이 생성한 파일들을 `main` 브랜치에 자동으로 커밋해줄 때까지 잠시 기다려주세요.

## 🧪 실험 목록

<!-- EXPERIMENT_LIST_START -->
| 번호 | 실험 이름 | 리포트 |
| :--- | :-------- | :----- |
| 01 | White Image Test | [Link](./experiments/01-white-image-test/report.md) |
| 02 | Text Rendering Test | [Link](./experiments/02-text-rendering-test/report.md) |
| 03 | Test | [Link](./experiments/03-test/report.md) |
| 04 | Final Workflow Test | [Link](./experiments/04-final-workflow-test/report.md) |
| 05 | Text Render Batch | [Link](./experiments/05-text-render-batch/report.md) |

<!-- EXPERIMENT_LIST_END -->
