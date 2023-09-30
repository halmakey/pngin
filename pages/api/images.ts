import { NextApiRequest, NextApiResponse } from "next";
import { withRecaptcha } from "@/utils/api-server/with-recaptcha";
import { withUser } from "@/utils/api-server/with-user";
import { checkAllEnvs } from "@/utils/check-env";
import { getS3AppClient } from "@/utils/api-server/shared";
import {
  isValidatorError,
  numberValidator,
  objectValidator,
  stringValidator,
} from "@/utils/validator";
import { nanoid } from "nanoid";
import { getObjectName } from "@/utils/s3-app-client";
import { UserAPI } from "@/utils/api";

checkAllEnvs();

const MAX_IMAGE_SIZE = 1024 * 1024 * 10;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "POST":
        return await postImages(req, res);
    }
    return res.status(405).json({});
  } catch (err) {
    if (isValidatorError(err)) {
      console.warn(err);
      return res.status(400).json({});
    }
    console.error(err);
    return res.status(500).json({});
  }
}

const postImages = withRecaptcha(
  "postimage",
  withUser<UserAPI.PostImagesResponse>(async (req, res, user) => {
    const { count } = objectValidator.with({
      token: stringValidator.default,
      count: numberValidator.range(1, MAX_IMAGE_SIZE + 1),
    })(req.body, "body");

    const imageIds = [...Array(count)].map(() => nanoid());
    const images = await Promise.all(
      imageIds.map(async (id) => {
        const post = await getS3AppClient().generateSignedPostUrl(
          getObjectName(id),
          "image/png",
          MAX_IMAGE_SIZE
        );
        return {
          id,
          post,
        };
      })
    );

    const exists = await Promise.all(
      imageIds.map((imageId) =>
        getS3AppClient().headObject(getObjectName(imageId))
      )
    );

    for (const exist of exists) {
      if (exist) {
        throw new Error("image already exists");
      }
    }

    res.json({
      images,
    });
  })
);
